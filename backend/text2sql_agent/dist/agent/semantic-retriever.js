import { SemanticEmbedder } from "./embedder.js";
import { QdrantVectorDB } from "./qdrant-client.js";
import { loadSchemaRegistry } from "./schema-registry.js";
import { queryCache } from "./query-cache.js";
import dotenv from "dotenv";
dotenv.config();
/**
 * Query Intent Types for optimization
 */
export var QueryIntent;
(function (QueryIntent) {
    QueryIntent["COUNT"] = "COUNT";
    QueryIntent["JOIN"] = "JOIN";
    QueryIntent["AGGREGATE"] = "AGGREGATE";
    QueryIntent["TIME_BASED"] = "TIME_BASED";
    QueryIntent["RANK"] = "RANK";
    QueryIntent["FILTER"] = "FILTER";
    QueryIntent["UNKNOWN"] = "UNKNOWN";
})(QueryIntent || (QueryIntent = {}));
/**
 * SemanticRetriever - Retrieves relevant context for SQL generation
 */
export class SemanticRetriever {
    constructor() {
        this.schema = null;
        this.embedder = new SemanticEmbedder();
        this.vectorDB = new QdrantVectorDB();
    }
    /**
     * Detect query intent to optimize retrieval
     */
    detectQueryIntent(query) {
        const lowerQuery = query.toLowerCase();
        // COUNT intent
        if (lowerQuery.includes("how many") ||
            lowerQuery.includes("count") ||
            lowerQuery.includes("total number")) {
            return QueryIntent.COUNT;
        }
        // JOIN intent
        if (lowerQuery.includes("join") ||
            lowerQuery.includes("relate") ||
            lowerQuery.includes("associate") ||
            (lowerQuery.includes("with") && lowerQuery.includes("their"))) {
            return QueryIntent.JOIN;
        }
        // TIME_BASED intent
        if (lowerQuery.includes("month") ||
            lowerQuery.includes("year") ||
            lowerQuery.includes("date") ||
            lowerQuery.includes("timeline") ||
            lowerQuery.includes("trend") ||
            lowerQuery.includes("over time")) {
            return QueryIntent.TIME_BASED;
        }
        // RANK intent
        if (lowerQuery.includes("top") ||
            lowerQuery.includes("bottom") ||
            lowerQuery.includes("rank") ||
            lowerQuery.includes("highest") ||
            lowerQuery.includes("lowest") ||
            lowerQuery.includes("best") ||
            lowerQuery.includes("worst")) {
            return QueryIntent.RANK;
        }
        // AGGREGATE intent
        if (lowerQuery.includes("average") ||
            lowerQuery.includes("sum") ||
            lowerQuery.includes("total") ||
            lowerQuery.includes("breakdown") ||
            lowerQuery.includes("distribution") ||
            lowerQuery.includes("analysis by")) {
            return QueryIntent.AGGREGATE;
        }
        // FILTER intent
        if (lowerQuery.includes("where") ||
            lowerQuery.includes("filter") ||
            lowerQuery.includes("specific") ||
            lowerQuery.includes("over budget") ||
            lowerQuery.includes("exceeds")) {
            return QueryIntent.FILTER;
        }
        return QueryIntent.UNKNOWN;
    }
    /**
     * Get relevant semantic models based on intent
     */
    filterModelsByIntent(models, intent) {
        // Map operations to intents
        const intentOperations = {
            [QueryIntent.COUNT]: ["COUNT"],
            [QueryIntent.JOIN]: ["JOIN", "LEFT JOIN"],
            [QueryIntent.AGGREGATE]: ["GROUP BY", "SUM", "AVG"],
            [QueryIntent.TIME_BASED]: ["DATE", "DATE_TRUNC", "INTERVAL"],
            [QueryIntent.RANK]: ["ORDER BY", "LIMIT"],
            [QueryIntent.FILTER]: ["WHERE"],
            [QueryIntent.UNKNOWN]: [],
        };
        if (!intentOperations[intent] || intentOperations[intent].length === 0) {
            return models;
        }
        return models.filter((model) => {
            // Check if model operations match intent
            const hasRelevantOperation = intentOperations[intent].some((op) => model.sql.toUpperCase().includes(op));
            return hasRelevantOperation;
        });
    }
    /**
     * Initialize the retriever
     */
    async initialize() {
        await this.embedder.initialize();
        await this.vectorDB.initialize();
        this.schema = await loadSchemaRegistry();
        console.log("✓ Semantic Retriever initialized");
    }
    /**
     * Retrieve relevant semantic models for a query
     */
    async retrieveSemanticModels(query, topK = 5) {
        try {
            console.log("🔍 Retrieving semantic models...");
            const queryVector = await this.embedder.embedQuery(query);
            const results = await this.vectorDB.searchSemanticModels(queryVector, topK);
            const models = results
                .map((r) => ({
                id: r.payload?.id || r.id,
                name: r.payload?.name || "Unknown",
                description: r.payload?.description || "",
                sql: r.payload?.sql || "",
                score: r.score || 0,
            }))
                .sort((a, b) => b.score - a.score);
            console.log(`✓ Retrieved ${models.length} semantic models`);
            return models;
        }
        catch (error) {
            console.error("⚠️  Error retrieving semantic models:", error);
            return [];
        }
    }
    /**
     * Retrieve relevant schema metadata for a query
     */
    async retrieveSchemaMetadata(query, topK = 10) {
        try {
            console.log("🔍 Retrieving schema metadata...");
            const queryVector = await this.embedder.embedQuery(query);
            const results = await this.vectorDB.searchSchemaMetadata(queryVector, topK);
            const columns = results
                .map((r) => ({
                table: r.payload?.table || "",
                column: r.payload?.column || (r.payload?.type === "table" ? r.payload.table : ""),
                type: r.payload?.data_type || r.payload?.type || "",
                description: r.payload?.description || "",
                unit: r.payload?.unit || undefined,
                score: r.score || 0,
            }))
                .filter((c) => c.column && c.table)
                .sort((a, b) => b.score - a.score);
            console.log(`✓ Retrieved ${columns.length} schema metadata items`);
            return columns;
        }
        catch (error) {
            console.error("⚠️  Error retrieving schema metadata:", error);
            return [];
        }
    }
    /**
     * Expand to related tables via relationships
     */
    expandRelationships(tableNames) {
        if (!this.schema)
            return [];
        const relationships = [];
        const visited = new Set();
        const traverse = (tableName, depth = 0) => {
            if (depth > 2 || visited.has(tableName))
                return;
            visited.add(tableName);
            const tableSchema = this.schema[tableName];
            if (!tableSchema)
                return;
            for (const rel of tableSchema.relationships) {
                const [joinKey] = rel.join_key.split(":");
                relationships.push({
                    from_table: tableName,
                    to_table: rel.table,
                    join_condition: rel.join_key,
                });
                // Recursively traverse related tables (limited depth)
                if (depth < 2) {
                    traverse(rel.table, depth + 1);
                }
            }
        };
        for (const tableName of tableNames) {
            traverse(tableName);
        }
        return Array.from(new Map(relationships.map((r) => [`${r.from_table}${r.to_table}`, r])).values());
    }
    /**
     * Build formatted context for the LLM
     */
    buildContextText(models, columns, relationships) {
        let context = "## Relevant SQL Patterns\n\n";
        // Add semantic models as examples
        if (models.length > 0) {
            context += "### Examples of Similar Queries:\n\n";
            for (const model of models) {
                context += `**${model.name}** - ${model.description}\n`;
                context += `\`\`\`sql\n${model.sql}\n\`\`\`\n\n`;
            }
        }
        // Add relevant schema
        const uniqueTables = Array.from(new Set(columns.map((c) => c.table)));
        if (uniqueTables.length > 0) {
            context += "### Relevant Schema Tables:\n\n";
            for (const tableName of uniqueTables) {
                if (!this.schema || !this.schema[tableName])
                    continue;
                const tableSchema = this.schema[tableName];
                const tableColumns = columns.filter((c) => c.table === tableName);
                context += `**${tableName}** - ${tableSchema.description}\n`;
                context += `Columns:\n`;
                for (const col of tableColumns) {
                    context += `  - \`${col.column}\` (${col.type})`;
                    if (col.description)
                        context += ` - ${col.description}`;
                    if (col.unit)
                        context += ` [${col.unit}]`;
                    context += "\n";
                }
                context += "\n";
            }
        }
        // Add relationships
        if (relationships.length > 0) {
            context += "### Table Relationships:\n\n";
            for (const rel of relationships) {
                context += `- \`${rel.from_table}\` → \`${rel.to_table}\` on ${rel.join_condition}\n`;
            }
            context += "\n";
        }
        return context;
    }
    /**
     * Estimate tokens in context (rough approximation: 4 chars per token)
     */
    estimateTokens(text) {
        return Math.ceil(text.length / 4);
    }
    /**
     * Build complete semantic context for a query
     */
    async buildContext(query, maxTokens = 600) {
        // Check cache first
        const cachedContext = queryCache.getResult(query);
        if (cachedContext) {
            console.log(`✓ Using cached context for query (saved embedding computation)`);
            return cachedContext;
        }
        if (!this.schema) {
            await this.initialize();
        }
        // Detect query intent
        const intent = this.detectQueryIntent(query);
        console.log(`🎯 Query Intent: ${intent}`);
        // Retrieve components
        let models = await this.retrieveSemanticModels(query, 5);
        models = this.filterModelsByIntent(models, intent);
        const columns = await this.retrieveSchemaMetadata(query, 10);
        // Get unique tables and expand relationships
        const tableNames = Array.from(new Set(columns.map((c) => c.table)));
        const relationships = this.expandRelationships(tableNames);
        // Build context text
        const contextText = this.buildContextText(models, columns, relationships);
        const tokenEstimate = this.estimateTokens(contextText);
        console.log(`📊 Context built: ~${tokenEstimate} tokens estimated`);
        const context = {
            models,
            columns,
            relationships,
            tables_involved: tableNames,
            context_text: contextText,
            token_estimate: tokenEstimate,
        };
        // Cache the result for 5 minutes
        queryCache.cacheResult(query, context);
        return context;
    }
    /**
     * Get the full context to pass to LLM
     */
    async getFullContext(query) {
        const context = await this.buildContext(query);
        return context.context_text;
    }
    /**
     * Initialize collections with embeddings (call this once during setup)
     */
    async initializeCollections() {
        console.log("\n📦 Initializing Qdrant collections with embeddings...\n");
        // Embed and insert semantic models
        console.log("1️⃣  Processing semantic models...");
        const semanticEmbeddings = await this.embedder.embedSemanticModels();
        const semanticPoints = semanticEmbeddings.map((e) => ({
            id: e.id,
            vector: e.embedding,
            payload: e.metadata,
        }));
        await this.vectorDB.insertSemanticModels(semanticPoints);
        // Embed and insert schema metadata
        console.log("\n2️⃣  Processing schema metadata...");
        const schemaEmbeddings = await this.embedder.embedSchemaMetadata();
        const schemaPoints = schemaEmbeddings.map((e) => ({
            id: e.id,
            vector: e.embedding,
            payload: e.metadata,
        }));
        await this.vectorDB.insertSchemaMetadata(schemaPoints);
        // Get stats
        console.log("\n📊 Collection Stats:");
        const semanticStats = await this.vectorDB.getCollectionStats("semantic_models");
        const schemaStats = await this.vectorDB.getCollectionStats("schema_metadata");
        console.log(`   ✓ Semantic Models: ${semanticStats.points_count} points`);
        console.log(`   ✓ Schema Metadata: ${schemaStats.points_count} points`);
        console.log("\n✅ Collections initialized successfully!\n");
    }
}
//# sourceMappingURL=semantic-retriever.js.map