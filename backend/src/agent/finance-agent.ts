import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { generateSQL, getTokenUsage, resetTokenUsage, type TokenUsage, type GeneratedSQL } from "./sql-generator.js";
import { validateQuery, type ValidationResult } from "./query-validator.js";
import { getSchemaDescription, loadSchemaRegistry } from "./schema-registry.js";
import dotenv from "dotenv";

dotenv.config();

// Types
export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  tokens?: { prompt: number; completion: number; total: number };
}

export interface AgentResponse {
  query: string;
  reasoning: string;
  sql: string;
  isValid: boolean;
  rawData: any[];
  summary: string;
  insights: string[];
  tokens: TokenUsage;
  conversationHistory: ConversationMessage[];
  executionSteps: string[];
  errors?: string[];
}

// Custom Exceptions
export class AgentException extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "AgentException";
  }
}

export class SQLGenerationException extends AgentException {
  constructor(message: string) {
    super("SQL_GENERATION_FAILED", message);
  }
}

export class ValidationException extends AgentException {
  constructor(message: string) {
    super("VALIDATION_FAILED", message);
  }
}

export class ExecutionException extends AgentException {
  constructor(message: string) {
    super("EXECUTION_FAILED", message);
  }
}

export class NoResultsException extends AgentException {
  constructor(message: string) {
    super("NO_RESULTS", message);
  }
}

/**
 * Tool 1: Load and validate schema using Schema Registry
 */
async function toolLoadSchema(): Promise<string> {
  try {
    console.log("🔧 Tool 1: Loading Schema Registry...");
    await loadSchemaRegistry();
    const schemaDescription = await getSchemaDescription();
    console.log("   ✓ Schema loaded and validated");
    return schemaDescription;
  } catch (error) {
    throw new AgentException(
      "SCHEMA_LOAD_FAILED",
      `Failed to load schema: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Tool 2: Generate SQL from natural language using LLM
 */
async function toolGenerateSQL(userQuery: string): Promise<GeneratedSQL> {
  try {
    console.log("🔧 Tool 2: Generating SQL from natural language...");
    const result = await generateSQL(userQuery);
    console.log(`   ✓ SQL generated: ${result.sql.substring(0, 60)}...`);
    return result;
  } catch (error) {
    throw new SQLGenerationException(
      `Failed to generate SQL: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Tool 3: Validate query syntax and semantics
 */
async function toolValidateQuery(sql: string, attemptNumber: number = 1): Promise<ValidationResult> {
  try {
    console.log(`🔧 Tool 3: Validating query (Attempt ${attemptNumber})...`);
    const result = await validateQuery(sql);
    
    if (result.valid) {
      console.log("   ✓ Query validation passed");
    } else {
      console.log(`   ⚠ Validation errors: ${result.errors.join(", ")}`);
    }
    
    return result;
  } catch (error) {
    throw new ValidationException(
      `Failed to validate query: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Tool 4: Regenerate SQL if validation fails
 */
async function toolRegenerateSQLWithFeedback(
  userQuery: string,
  validationErrors: string[]
): Promise<GeneratedSQL> {
  try {
    console.log("🔧 Tool 4: Regenerating SQL with validation feedback...");
    
    const feedbackPrompt = `${userQuery}
    
IMPORTANT: The previous query had these errors - please fix them:
${validationErrors.map((e) => `- ${e}`).join("\n")}`;

    const result = await generateSQL(feedbackPrompt);
    console.log(`   ✓ SQL regenerated: ${result.sql.substring(0, 60)}...`);
    return result;
  } catch (error) {
    throw new SQLGenerationException(
      `Failed to regenerate SQL: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Tool 5: Execute validated query against database
 */
async function toolExecuteQuery(sql: string): Promise<any[]> {
  try {
    console.log("🔧 Tool 5: Executing query against database...");

    const connectionString = process.env.SUPABASE_CONNECTION_STRING;
    if (!connectionString) {
      throw new ExecutionException(
        "SUPABASE_CONNECTION_STRING not configured for query execution"
      );
    }

    const sql_client = postgres(connectionString);
    const queryResults = await sql_client.unsafe(sql);
    await sql_client.end();

    if (!queryResults || queryResults.length === 0) {
      throw new NoResultsException("Query returned no results");
    }

    console.log(`   ✓ Query executed: ${queryResults.length} rows returned`);
    return queryResults;
  } catch (error) {
    if (error instanceof AgentException) throw error;
    
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    if (errorMsg.includes("connection")) {
      throw new ExecutionException(
        `Database connection failed. Ensure SUPABASE_CONNECTION_STRING is configured.`
      );
    } else if (errorMsg.includes("syntax")) {
      throw new ExecutionException(`SQL syntax error in query: ${errorMsg}`);
    }
    
    throw new ExecutionException(`Query execution failed: ${errorMsg}`);
  }
}

/**
 * Tool 6: Format results with insights
 */
function toolFormatResults(
  sql: string,
  rawData: any[],
  reasoning: string
): { summary: string; insights: string[] } {
  console.log("🔧 Tool 6: Formatting results with insights...");

  const insights: string[] = [];
  let summary = `Query returned ${rawData.length} record(s).\n\n`;

  // Analyze query type and generate insights
  if (sql.includes("COUNT(*)")) {
    const count = rawData[0]?.count || rawData[0]?.total_accounts || 0;
    summary += `Total count: ${count}`;
    insights.push(`Found ${count} matching records`);
  } else if (sql.includes("SUM(")) {
    const sumKey = Object.keys(rawData[0] || {})[0];
    const sumValue = rawData[0]?.[sumKey];
    summary += `Aggregated sum: $${sumValue}`;
    insights.push(`Total aggregated value: $${sumValue}`);
  } else if (sql.includes("GROUP BY")) {
    summary += `Results grouped into ${rawData.length} categories:\n`;
    rawData.slice(0, 3).forEach((row) => {
      summary += `  • ${JSON.stringify(row)}\n`;
    });
    if (rawData.length > 3) {
      summary += `  ... and ${rawData.length - 3} more`;
    }
    insights.push(`Data grouped across ${rawData.length} categories`);
  } else if (sql.includes("ORDER BY") && sql.includes("LIMIT")) {
    summary += `Showing top ${Math.min(10, rawData.length)} results`;
    insights.push(`Retrieved ranked results (${rawData.length} records)`);
  } else {
    summary += `Retrieved ${rawData.length} record(s) from database`;
  }

  insights.push(`Reasoning: ${reasoning}`);
  console.log("   ✓ Results formatted with insights");
  return { summary, insights };
}

/**
 * Main Finance Agent - Functional Pipeline
 */
export async function runFinanceAgent(
  userQuery: string,
  conversationHistory: ConversationMessage[] = []
): Promise<AgentResponse> {
  resetTokenUsage();

  const executionSteps: string[] = [];
  let currentSQL = "";
  let currentReasoning = "";
  let validationResult: ValidationResult | null = null;
  let queryResults: any[] = [];

  try {
    console.log("\n" + "=".repeat(80));
    console.log("🚀 FINANCE AGENT STARTED");
    console.log("=".repeat(80));

    // Add user message to history
    const updatedHistory: ConversationMessage[] = [
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

    // STEP 2: Generate SQL
    executionSteps.push("STEP 2: Generating SQL from natural language...");
    let sqlResult = await toolGenerateSQL(userQuery);
    currentSQL = sqlResult.sql;
    currentReasoning = sqlResult.reasoning;

    // STEP 3: Validate Query (First Attempt)
    executionSteps.push("STEP 3: Validating generated SQL (Attempt 1)...");
    validationResult = await toolValidateQuery(currentSQL, 1);

    // STEP 4: Retry if validation fails
    if (!validationResult.valid) {
      executionSteps.push("STEP 4: Query validation failed, attempting to regenerate with feedback...");
      
      sqlResult = await toolRegenerateSQLWithFeedback(userQuery, validationResult.errors);
      currentSQL = sqlResult.sql;
      currentReasoning = sqlResult.reasoning;

      // Validate regenerated query
      executionSteps.push("STEP 5: Validating regenerated SQL (Attempt 2)...");
      validationResult = await toolValidateQuery(currentSQL, 2);

      if (!validationResult.valid) {
        throw new ValidationException(
          `Query validation failed after 2 attempts: ${validationResult.errors.join(", ")}`
        );
      }
    }

    // STEP 5/6: Execute Query
    executionSteps.push("STEP 6: Executing validated query...");
    queryResults = await toolExecuteQuery(currentSQL);

    // STEP 6/7: Format Results
    executionSteps.push("STEP 7: Formatting results with insights...");
    const { summary, insights } = toolFormatResults(currentSQL, queryResults, currentReasoning);

    // Add assistant message to history
    const newMessage: ConversationMessage = {
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

    const finalResponse: AgentResponse = {
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
    };

    console.log("\n" + "=".repeat(80));
    console.log("✅ AGENT COMPLETED SUCCESSFULLY");
    console.log("=".repeat(80) + "\n");

    return finalResponse;
  } catch (error) {
    if (error instanceof AgentException) {
      console.error(`\n❌ Agent Error [${error.code}]: ${error.message}`);
      throw error;
    }

    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Unexpected Error: ${errorMsg}`);
    throw new AgentException("UNKNOWN_ERROR", `Unexpected error: ${errorMsg}`);
  }
}
