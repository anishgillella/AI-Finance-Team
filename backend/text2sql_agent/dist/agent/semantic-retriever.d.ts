export interface RetrievedModel {
    id: string;
    name: string;
    description: string;
    sql: string;
    score: number;
}
export interface RetrievedColumn {
    table: string;
    column: string;
    type: string;
    description?: string;
    unit?: string;
    score: number;
}
export interface RetrievedRelationship {
    from_table: string;
    to_table: string;
    join_condition: string;
}
export interface SemanticContext {
    models: RetrievedModel[];
    columns: RetrievedColumn[];
    relationships: RetrievedRelationship[];
    tables_involved: string[];
    context_text: string;
    token_estimate: number;
}
/**
 * Query Intent Types for optimization
 */
export declare enum QueryIntent {
    COUNT = "COUNT",
    JOIN = "JOIN",
    AGGREGATE = "AGGREGATE",
    TIME_BASED = "TIME_BASED",
    RANK = "RANK",
    FILTER = "FILTER",
    UNKNOWN = "UNKNOWN"
}
/**
 * SemanticRetriever - Retrieves relevant context for SQL generation
 */
export declare class SemanticRetriever {
    private embedder;
    private vectorDB;
    private schema;
    constructor();
    /**
     * Detect query intent to optimize retrieval
     */
    private detectQueryIntent;
    /**
     * Get relevant semantic models based on intent
     */
    private filterModelsByIntent;
    /**
     * Initialize the retriever
     */
    initialize(): Promise<void>;
    /**
     * Retrieve relevant semantic models for a query
     */
    retrieveSemanticModels(query: string, topK?: number): Promise<RetrievedModel[]>;
    /**
     * Retrieve relevant schema metadata for a query
     */
    retrieveSchemaMetadata(query: string, topK?: number): Promise<RetrievedColumn[]>;
    /**
     * Expand to related tables via relationships
     */
    private expandRelationships;
    /**
     * Build formatted context for the LLM
     */
    private buildContextText;
    /**
     * Estimate tokens in context (rough approximation: 4 chars per token)
     */
    private estimateTokens;
    /**
     * Build complete semantic context for a query
     */
    buildContext(query: string, maxTokens?: number): Promise<SemanticContext>;
    /**
     * Get the full context to pass to LLM
     */
    getFullContext(query: string): Promise<string>;
    /**
     * Initialize collections with embeddings (call this once during setup)
     */
    initializeCollections(): Promise<void>;
}
//# sourceMappingURL=semantic-retriever.d.ts.map