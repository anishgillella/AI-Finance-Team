import crypto from "crypto";

export interface CachedResult {
  data: any;
  timestamp: number;
  ttl: number;
}

/**
 * QueryCache - Caches query results and embeddings
 * Reduces redundant computations and improves latency
 */
export class QueryCache {
  private resultCache: Map<string, CachedResult> = new Map();
  private embeddingCache: Map<string, { vector: number[]; timestamp: number }> =
    new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate hash for query caching
   */
  private hashQuery(query: string): string {
    return crypto.createHash("md5").update(query).digest("hex");
  }

  /**
   * Cache a query result
   */
  cacheResult(query: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    const hash = this.hashQuery(query);
    this.resultCache.set(hash, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get cached result if available and not expired
   */
  getResult(query: string): any | null {
    const hash = this.hashQuery(query);
    const cached = this.resultCache.get(hash);

    if (!cached) {
      return null;
    }

    const age = Date.now() - cached.timestamp;
    if (age > cached.ttl) {
      this.resultCache.delete(hash);
      return null;
    }

    return cached.data;
  }

  /**
   * Cache embedding vector
   */
  cacheEmbedding(text: string, vector: number[]): void {
    const hash = crypto.createHash("md5").update(text).digest("hex");
    this.embeddingCache.set(hash, {
      vector,
      timestamp: Date.now(),
    });
  }

  /**
   * Get cached embedding
   */
  getEmbedding(text: string): number[] | null {
    const hash = crypto.createHash("md5").update(text).digest("hex");
    const cached = this.embeddingCache.get(hash);

    if (!cached) {
      return null;
    }

    // Keep embeddings in cache longer (1 hour)
    const age = Date.now() - cached.timestamp;
    if (age > 60 * 60 * 1000) {
      this.embeddingCache.delete(hash);
      return null;
    }

    return cached.vector;
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();

    // Clear expired results
    for (const [key, cached] of this.resultCache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.resultCache.delete(key);
      }
    }

    // Clear old embeddings
    for (const [key, cached] of this.embeddingCache.entries()) {
      if (now - cached.timestamp > 60 * 60 * 1000) {
        this.embeddingCache.delete(key);
      }
    }
  }

  /**
   * Get cache stats
   */
  getStats(): {
    resultCacheSize: number;
    embeddingCacheSize: number;
    totalMemoryUsage: string;
  } {
    return {
      resultCacheSize: this.resultCache.size,
      embeddingCacheSize: this.embeddingCache.size,
      totalMemoryUsage: `${((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2))} MB`,
    };
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.resultCache.clear();
    this.embeddingCache.clear();
  }
}

export const queryCache = new QueryCache();
