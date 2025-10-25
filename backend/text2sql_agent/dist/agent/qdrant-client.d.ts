import type { AxiosInstance } from "axios";
export interface QdrantPoint {
    id: string;
    vector: number[];
    payload: Record<string, any>;
}
/**
 * QdrantVectorDB - Manages Qdrant vector database connections and collections using HTTP API
 */
export declare class QdrantVectorDB {
    private url;
    private apiKey;
    private initialized;
    private client;
    readonly SEMANTIC_MODELS_COLLECTION = "semantic_models";
    readonly SCHEMA_METADATA_COLLECTION = "schema_metadata";
    readonly VECTOR_SIZE = 384;
    constructor();
    /**
     * Initialize Qdrant and create collections
     */
    initialize(): Promise<void>;
    /**
     * Create a collection if it doesn't exist
     */
    private createCollection;
    /**
     * Insert points into semantic models collection
     */
    insertSemanticModels(points: QdrantPoint[]): Promise<number>;
    /**
     * Insert points into schema metadata collection
     */
    insertSchemaMetadata(points: QdrantPoint[]): Promise<number>;
    /**
     * Search semantic models by vector
     */
    searchSemanticModels(vector: number[], topK?: number): Promise<any[]>;
    /**
     * Search schema metadata by vector
     */
    searchSchemaMetadata(vector: number[], topK?: number): Promise<any[]>;
    /**
     * Get collection stats
     */
    getCollectionStats(collectionName: string): Promise<any>;
    /**
     * Clear all collections
     */
    clearCollections(): Promise<void>;
    /**
     * Convert string ID to numeric ID for Qdrant
     * Qdrant accepts string IDs in newer versions, but for compatibility we hash to numeric
     */
    private stringToId;
    /**
     * Get client for advanced operations
     */
    getClient(): AxiosInstance;
}
//# sourceMappingURL=qdrant-client.d.ts.map