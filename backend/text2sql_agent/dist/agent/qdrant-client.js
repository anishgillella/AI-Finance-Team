import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
/**
 * QdrantVectorDB - Manages Qdrant vector database connections and collections using HTTP API
 */
export class QdrantVectorDB {
    constructor() {
        this.initialized = false;
        // Collection names
        this.SEMANTIC_MODELS_COLLECTION = "semantic_models";
        this.SCHEMA_METADATA_COLLECTION = "schema_metadata";
        // Vector size for all-MiniLM-L6-v2 model
        this.VECTOR_SIZE = 384;
        this.url = process.env.QDRANT_URL || "http://localhost:6333";
        this.apiKey = process.env.QDRANT_API_KEY || "";
        // Create axios instance with base URL
        this.client = axios.create({
            baseURL: this.url,
            headers: this.apiKey ? { "api-key": this.apiKey } : {},
            timeout: 30000,
        });
    }
    /**
     * Initialize Qdrant and create collections
     */
    async initialize() {
        if (this.initialized) {
            console.log("✓ Qdrant already initialized");
            return;
        }
        try {
            console.log(`🔗 Connecting to Qdrant at ${this.url}...`);
            // Check health
            const health = await this.client.get("/collections");
            console.log("✓ Connected to Qdrant");
            // Create semantic models collection
            await this.createCollection(this.SEMANTIC_MODELS_COLLECTION, "Semantic SQL patterns for finance queries");
            // Create schema metadata collection
            await this.createCollection(this.SCHEMA_METADATA_COLLECTION, "Schema metadata (tables and columns) for the finance database");
            this.initialized = true;
            console.log("✓ Qdrant collections initialized");
        }
        catch (error) {
            throw new Error(`Failed to initialize Qdrant: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Create a collection if it doesn't exist
     */
    async createCollection(name, description) {
        try {
            const response = await this.client.get("/collections");
            const collections = response.data?.result || response.data?.collections || [];
            const exists = Array.isArray(collections) && collections.some((c) => c.name === name);
            if (exists) {
                console.log(`✓ Collection '${name}' already exists`);
                return;
            }
            console.log(`📦 Creating collection '${name}'...`);
            await this.client.put(`/collections/${name}`, {
                vectors: {
                    size: this.VECTOR_SIZE,
                    distance: "Cosine",
                },
            });
            console.log(`✓ Collection '${name}' created`);
        }
        catch (error) {
            const isConflict = error?.response?.status === 409 || error?.message?.includes("already exists");
            if (isConflict) {
                console.log(`✓ Collection '${name}' already exists`);
            }
            else {
                throw error;
            }
        }
    }
    /**
     * Insert points into semantic models collection
     */
    async insertSemanticModels(points) {
        if (!this.initialized) {
            await this.initialize();
        }
        try {
            console.log(`📥 Inserting ${points.length} semantic models into Qdrant...`);
            const formattedPoints = points.map((p) => ({
                id: this.stringToId(p.id),
                vector: p.vector,
                payload: p.payload,
            }));
            await this.client.post(`/collections/${this.SEMANTIC_MODELS_COLLECTION}/points`, {
                points: formattedPoints,
            });
            console.log(`✓ Inserted ${points.length} semantic models`);
            return points.length;
        }
        catch (error) {
            throw new Error(`Failed to insert semantic models: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Insert points into schema metadata collection
     */
    async insertSchemaMetadata(points) {
        if (!this.initialized) {
            await this.initialize();
        }
        try {
            console.log(`📥 Inserting ${points.length} schema metadata items into Qdrant...`);
            const formattedPoints = points.map((p) => ({
                id: this.stringToId(p.id),
                vector: p.vector,
                payload: p.payload,
            }));
            await this.client.post(`/collections/${this.SCHEMA_METADATA_COLLECTION}/points`, {
                points: formattedPoints,
            });
            console.log(`✓ Inserted ${points.length} schema metadata items`);
            return points.length;
        }
        catch (error) {
            throw new Error(`Failed to insert schema metadata: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Search semantic models by vector
     */
    async searchSemanticModels(vector, topK = 5) {
        if (!this.initialized) {
            await this.initialize();
        }
        try {
            const response = await this.client.post(`/collections/${this.SEMANTIC_MODELS_COLLECTION}/points/search`, {
                vector,
                limit: topK,
                with_payload: true,
                with_vectors: false,
            });
            return response.data?.result || [];
        }
        catch (error) {
            throw new Error(`Failed to search semantic models: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Search schema metadata by vector
     */
    async searchSchemaMetadata(vector, topK = 10) {
        if (!this.initialized) {
            await this.initialize();
        }
        try {
            const response = await this.client.post(`/collections/${this.SCHEMA_METADATA_COLLECTION}/points/search`, {
                vector,
                limit: topK,
                with_payload: true,
                with_vectors: false,
            });
            return response.data?.result || [];
        }
        catch (error) {
            throw new Error(`Failed to search schema metadata: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get collection stats
     */
    async getCollectionStats(collectionName) {
        try {
            const response = await this.client.get(`/collections/${collectionName}`);
            return response.data?.result || {};
        }
        catch (error) {
            throw new Error(`Failed to get collection stats: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Clear all collections
     */
    async clearCollections() {
        try {
            console.log("🗑️  Clearing all collections...");
            for (const collection of [this.SEMANTIC_MODELS_COLLECTION, this.SCHEMA_METADATA_COLLECTION]) {
                try {
                    await this.client.delete(`/collections/${collection}`);
                    console.log(`✓ Deleted collection '${collection}'`);
                }
                catch (error) {
                    console.warn(`⚠️  Could not delete collection '${collection}': ${error}`);
                }
            }
            this.initialized = false;
        }
        catch (error) {
            throw new Error(`Failed to clear collections: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Convert string ID to numeric ID for Qdrant
     * Qdrant accepts string IDs in newer versions, but for compatibility we hash to numeric
     */
    stringToId(str) {
        // Try to parse as number first
        const num = parseInt(str, 10);
        if (!isNaN(num)) {
            return num;
        }
        // For string IDs, Qdrant client should handle them directly
        // But we can also use the string as-is since newer versions support it
        return str;
    }
    /**
     * Get client for advanced operations
     */
    getClient() {
        return this.client;
    }
}
//# sourceMappingURL=qdrant-client.js.map