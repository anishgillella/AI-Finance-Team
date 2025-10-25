export interface CachedResult {
    data: any;
    timestamp: number;
    ttl: number;
}
/**
 * QueryCache - Caches query results and embeddings
 * Reduces redundant computations and improves latency
 */
export declare class QueryCache {
    private resultCache;
    private embeddingCache;
    private readonly DEFAULT_TTL;
    /**
     * Generate hash for query caching
     */
    private hashQuery;
    /**
     * Cache a query result
     */
    cacheResult(query: string, data: any, ttl?: number): void;
    /**
     * Get cached result if available and not expired
     */
    getResult(query: string): any | null;
    /**
     * Cache embedding vector
     */
    cacheEmbedding(text: string, vector: number[]): void;
    /**
     * Get cached embedding
     */
    getEmbedding(text: string): number[] | null;
    /**
     * Clear expired entries
     */
    clearExpired(): void;
    /**
     * Get cache stats
     */
    getStats(): {
        resultCacheSize: number;
        embeddingCacheSize: number;
        totalMemoryUsage: string;
    };
    /**
     * Clear all caches
     */
    clearAll(): void;
}
export declare const queryCache: QueryCache;
//# sourceMappingURL=query-cache.d.ts.map