import postgres from "postgres";
import { generateSQL, getTokenUsage, resetTokenUsage } from "./sql-generator.js";
import { validateQuery } from "./query-validator.js";
import { loadSchemaRegistry } from "./schema-registry.js";
import { SemanticRetriever } from "./semantic-retriever.js";
import dotenv from "dotenv";
dotenv.config();
// Custom Exceptions
export class AgentException extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = "AgentException";
    }
}
export class SQLGenerationException extends AgentException {
    constructor(message) {
        super("SQL_GENERATION_FAILED", message);
    }
}
export class ValidationException extends AgentException {
    constructor(message) {
        super("VALIDATION_FAILED", message);
    }
}
export class ExecutionException extends AgentException {
    constructor(message) {
        super("EXECUTION_FAILED", message);
    }
}
export class NoResultsException extends AgentException {
    constructor(message) {
        super("NO_RESULTS", message);
    }
}
/**
 * Tool 1: Load and validate schema using Schema Registry
 */
async function toolLoadSchema() {
    try {
        console.log("🔧 Tool 1: Loading Schema Registry...");
        await loadSchemaRegistry();
        console.log("   ✓ Schema loaded and validated");
        return "Schema loaded";
    }
    catch (error) {
        throw new AgentException("SCHEMA_LOAD_FAILED", `Failed to load schema: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Tool 2: Retrieve semantic context using Qdrant
 */
async function toolGetSemanticContext(userQuery, retriever) {
    try {
        console.log("🔧 Tool 2: Retrieving semantic context from Qdrant...");
        const context = await retriever.getFullContext(userQuery);
        console.log("   ✓ Semantic context retrieved");
        return context;
    }
    catch (error) {
        console.warn("   ⚠️  Semantic retriever unavailable, falling back to full schema");
        return "";
    }
}
/**
 * Tool 3: Generate SQL from natural language using LLM
 */
async function toolGenerateSQL(userQuery, semanticContext) {
    try {
        console.log("🔧 Tool 3: Generating SQL from natural language...");
        const result = await generateSQL(userQuery, semanticContext);
        console.log(`   ✓ SQL generated: ${result.sql.substring(0, 60)}...`);
        return result;
    }
    catch (error) {
        throw new SQLGenerationException(`Failed to generate SQL: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Tool 4: Validate query syntax and semantics
 */
async function toolValidateQuery(sql, attemptNumber = 1) {
    try {
        console.log(`🔧 Tool 4: Validating query (Attempt ${attemptNumber})...`);
        const result = await validateQuery(sql);
        if (result.valid) {
            console.log("   ✓ Query validation passed");
        }
        else {
            console.log(`   ⚠ Validation errors: ${result.errors.join(", ")}`);
        }
        return result;
    }
    catch (error) {
        throw new ValidationException(`Failed to validate query: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Tool 5: Regenerate SQL if validation fails
 */
async function toolRegenerateSQLWithFeedback(userQuery, validationErrors, semanticContext) {
    try {
        console.log("🔧 Tool 5: Regenerating SQL with validation feedback...");
        const feedbackPrompt = `${userQuery}
    
IMPORTANT: The previous query had these errors - please fix them:
${validationErrors.map((e) => `- ${e}`).join("\n")}`;
        const result = await generateSQL(feedbackPrompt, semanticContext);
        console.log(`   ✓ SQL regenerated: ${result.sql.substring(0, 60)}...`);
        return result;
    }
    catch (error) {
        throw new SQLGenerationException(`Failed to regenerate SQL: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Tool 6: Execute validated query against database
 */
async function toolExecuteQuery(sql) {
    try {
        console.log("🔧 Tool 6: Executing query against database...");
        const connectionString = process.env.SUPABASE_CONNECTION_STRING;
        if (!connectionString) {
            throw new ExecutionException("SUPABASE_CONNECTION_STRING not configured for query execution");
        }
        const sql_client = postgres(connectionString);
        const queryResults = await sql_client.unsafe(sql);
        await sql_client.end();
        if (!queryResults || queryResults.length === 0) {
            throw new NoResultsException("Query returned no results");
        }
        console.log(`   ✓ Query executed: ${queryResults.length} rows returned`);
        return queryResults;
    }
    catch (error) {
        if (error instanceof AgentException)
            throw error;
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (errorMsg.includes("connection")) {
            throw new ExecutionException(`Database connection failed. Ensure SUPABASE_CONNECTION_STRING is configured.`);
        }
        else if (errorMsg.includes("syntax")) {
            throw new ExecutionException(`SQL syntax error in query: ${errorMsg}`);
        }
        throw new ExecutionException(`Query execution failed: ${errorMsg}`);
    }
}
/**
 * Tool 7: Format results with insights
 */
function toolFormatResults(sql, rawData, reasoning) {
    console.log("🔧 Tool 7: Formatting results with insights...");
    const insights = [];
    let summary = `Query returned ${rawData.length} record(s).\n\n`;
    // Analyze query type and generate insights
    if (sql.includes("COUNT(*)")) {
        const count = rawData[0]?.count || rawData[0]?.total_accounts || 0;
        summary += `Total count: ${count}`;
        insights.push(`Found ${count} matching records`);
    }
    else if (sql.includes("SUM(")) {
        const sumKey = Object.keys(rawData[0] || {})[0];
        const sumValue = rawData[0]?.[sumKey];
        summary += `Aggregated sum: $${sumValue}`;
        insights.push(`Total aggregated value: $${sumValue}`);
    }
    else if (sql.includes("GROUP BY")) {
        summary += `Results grouped into ${rawData.length} categories:\n`;
        rawData.slice(0, 3).forEach((row) => {
            summary += `  • ${JSON.stringify(row)}\n`;
        });
        if (rawData.length > 3) {
            summary += `  ... and ${rawData.length - 3} more`;
        }
        insights.push(`Data grouped across ${rawData.length} categories`);
    }
    else if (sql.includes("ORDER BY") && sql.includes("LIMIT")) {
        summary += `Showing top ${Math.min(10, rawData.length)} results`;
        insights.push(`Retrieved ranked results (${rawData.length} records)`);
    }
    else {
        summary += `Retrieved ${rawData.length} record(s) from database`;
    }
    insights.push(`Reasoning: ${reasoning}`);
    console.log("   ✓ Results formatted with insights");
    return { summary, insights };
}
/**
 * Main Finance Agent - Functional Pipeline
 */
export async function runFinanceAgent(userQuery, conversationHistory = []) {
    resetTokenUsage();
    const executionSteps = [];
    let currentSQL = "";
    let currentReasoning = "";
    let validationResult = null;
    let queryResults = [];
    let semanticContextInfo = { tokensEstimated: 0, modelsUsed: 0, columnsUsed: 0 };
    const retriever = new SemanticRetriever();
    try {
        console.log("\n" + "=".repeat(80));
        console.log("🚀 TEXT-TO-SQL AGENT STARTED");
        console.log("=".repeat(80));
        // Add user message to history
        const updatedHistory = [
            ...conversationHistory,
            {
                role: "user",
                content: userQuery,
                timestamp: new Date(),
            },
        ];
        // STEP 1: Load Schema
        executionSteps.push("STEP 1: Loading schema registry...");
        await toolLoadSchema();
        // STEP 2: Get Semantic Context (NEW)
        executionSteps.push("STEP 2: Retrieving semantic context from Qdrant...");
        let semanticContext = "";
        try {
            await retriever.initialize();
            const fullContext = await retriever.buildContext(userQuery);
            semanticContext = fullContext.context_text;
            semanticContextInfo = {
                tokensEstimated: fullContext.token_estimate,
                modelsUsed: fullContext.models.length,
                columnsUsed: fullContext.columns.length,
            };
            console.log(`   ✓ Semantic context retrieved (est. ${fullContext.token_estimate} tokens)`);
        }
        catch (error) {
            console.warn("   ⚠️  Semantic context unavailable, using full schema fallback");
            semanticContext = "";
        }
        // STEP 3: Generate SQL
        executionSteps.push("STEP 3: Generating SQL from natural language...");
        let sqlResult = await toolGenerateSQL(userQuery, semanticContext);
        currentSQL = sqlResult.sql;
        currentReasoning = sqlResult.reasoning;
        // STEP 4: Validate Query (First Attempt)
        executionSteps.push("STEP 4: Validating generated SQL (Attempt 1)...");
        validationResult = await toolValidateQuery(currentSQL, 1);
        // STEP 5: Retry if validation fails
        if (!validationResult.valid) {
            executionSteps.push("STEP 5: Query validation failed, attempting to regenerate with feedback...");
            sqlResult = await toolRegenerateSQLWithFeedback(userQuery, validationResult.errors, semanticContext);
            currentSQL = sqlResult.sql;
            currentReasoning = sqlResult.reasoning;
            // Validate regenerated query
            executionSteps.push("STEP 6: Validating regenerated SQL (Attempt 2)...");
            validationResult = await toolValidateQuery(currentSQL, 2);
            if (!validationResult.valid) {
                throw new ValidationException(`Query validation failed after 2 attempts: ${validationResult.errors.join(", ")}`);
            }
        }
        // STEP 6/7: Execute Query
        executionSteps.push("STEP 7: Executing validated query...");
        queryResults = await toolExecuteQuery(currentSQL);
        // STEP 7/8: Format Results
        executionSteps.push("STEP 8: Formatting results with insights...");
        const { summary, insights } = toolFormatResults(currentSQL, queryResults, currentReasoning);
        // Add assistant message to history
        const newMessage = {
            role: "assistant",
            content: summary,
            timestamp: new Date(),
            tokens: {
                prompt: 0,
                completion: 0,
                total: getTokenUsage().totalTokens,
            },
        };
        updatedHistory.push(newMessage);
        const finalResponse = {
            query: userQuery,
            reasoning: currentReasoning,
            sql: currentSQL,
            isValid: validationResult?.valid || false,
            rawData: queryResults,
            summary,
            insights,
            tokens: getTokenUsage(),
            conversationHistory: updatedHistory,
            executionSteps,
            semanticContext: semanticContextInfo,
        };
        console.log("\n" + "=".repeat(80));
        console.log("✅ AGENT COMPLETED SUCCESSFULLY");
        console.log("=".repeat(80) + "\n");
        return finalResponse;
    }
    catch (error) {
        if (error instanceof AgentException) {
            console.error(`\n❌ Agent Error [${error.code}]: ${error.message}`);
            throw error;
        }
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`\n❌ Unexpected Error: ${errorMsg}`);
        throw new AgentException("UNKNOWN_ERROR", `Unexpected error: ${errorMsg}`);
    }
}
//# sourceMappingURL=finance-agent.js.map