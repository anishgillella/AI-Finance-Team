export interface EmbeddingResult {
    id: string;
    text: string;
    embedding: number[];
    metadata: Record<string, any>;
}
/**
 * SemanticEmbedder - Manages embeddings using HuggingFace sentence-transformers
 */
export declare class SemanticEmbedder {
    private extractor;
    private model_name;
    private initialized;
    /**
     * Initialize the embedder with the sentence-transformers model
     */
    initialize(): Promise<void>;
    /**
     * Embed a single text string
     */
    embedText(text: string): Promise<number[]>;
    /**
     * Embed all semantic models for Qdrant collection
     */
    embedSemanticModels(): Promise<EmbeddingResult[]>;
    /**
     * Embed schema metadata for Qdrant collection
     */
    embedSchemaMetadata(): Promise<EmbeddingResult[]>;
    /**
     * Get embedding for a user query
     */
    embedQuery(query: string): Promise<number[]>;
}
//# sourceMappingURL=embedder.d.ts.map