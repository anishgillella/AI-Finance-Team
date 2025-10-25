import { env } from "@xenova/transformers";
import { pipeline } from "@xenova/transformers";
import { SEMANTIC_MODELS, type SemanticModel } from "../data/semantic-models.js";
import { loadSchemaRegistry, type TableSchema } from "./schema-registry.js";
import { queryCache } from "./query-cache.js";
import dotenv from "dotenv";

dotenv.config();

// Xenova transformers configuration
env.allowLocalModels = true;
env.allowRemoteModels = true;

export interface EmbeddingResult {
  id: string;
  text: string;
  embedding: number[];
  metadata: Record<string, any>;
}

/**
 * SemanticEmbedder - Manages embeddings using HuggingFace sentence-transformers
 */
export class SemanticEmbedder {
  private extractor: any;
  private model_name = "Xenova/all-MiniLM-L6-v2"; // 384-dimensional embeddings
  private initialized = false;

  /**
   * Initialize the embedder with the sentence-transformers model
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log("✓ Embedder already initialized");
      return;
    }

    try {
      console.log(`🤖 Loading embedder model: ${this.model_name}...`);
      this.extractor = await pipeline("feature-extraction", this.model_name);
      this.initialized = true;
      console.log("✓ Embedder model loaded successfully");
    } catch (error) {
      throw new Error(`Failed to initialize embedder: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Embed a single text string
   */
  async embedText(text: string): Promise<number[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Check cache first
    const cached = queryCache.getEmbedding(text);
    if (cached) {
      console.log(`✓ Using cached embedding for: "${text.substring(0, 40)}..."`);
      return cached;
    }

    try {
      const result = await this.extractor(text, { pooling: "mean", normalize: true });
      const embedding = Array.from(result.data as number[]);
      
      // Cache the embedding
      queryCache.cacheEmbedding(text, embedding);
      
      return embedding;
    } catch (error) {
      throw new Error(`Failed to embed text: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Embed all semantic models for Qdrant collection
   */
  async embedSemanticModels(): Promise<EmbeddingResult[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log("📊 Embedding semantic models...");
    const results: EmbeddingResult[] = [];

    for (const model of SEMANTIC_MODELS) {
      try {
        const embedding = await this.embedText(model.text);
        results.push({
          id: model.id,
          text: model.text,
          embedding,
          metadata: {
            name: model.name,
            description: model.description,
            tables: model.tables,
            operations: model.operations,
            use_cases: model.use_cases,
            sql: model.sql,
          },
        });
      } catch (error) {
        console.error(`⚠️  Failed to embed model ${model.id}:`, error);
      }
    }

    console.log(`✓ Embedded ${results.length} semantic models`);
    return results;
  }

  /**
   * Embed schema metadata for Qdrant collection
   */
  async embedSchemaMetadata(): Promise<EmbeddingResult[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log("📊 Embedding schema metadata...");
    const schema = await loadSchemaRegistry();
    const results: EmbeddingResult[] = [];
    let count = 0;

    for (const [tableName, tableSchema] of Object.entries(schema)) {
      // Embed table description
      if (tableSchema.description) {
        try {
          const tableId = `table_${tableName}`;
          const embedding = await this.embedText(
            `${tableName} - ${tableSchema.description}`
          );
          results.push({
            id: tableId,
            text: `${tableName} - ${tableSchema.description}`,
            embedding,
            metadata: {
              type: "table",
              table: tableName,
              description: tableSchema.description,
            },
          });
          count++;
        } catch (error) {
          console.error(`⚠️  Failed to embed table ${tableName}:`, error);
        }
      }

      // Embed each column with its metadata
      for (const [columnName, columnInfo] of Object.entries(tableSchema.columns)) {
        try {
          const columnId = `col_${tableName}_${columnName}`;
          const text = `${tableName}.${columnName} - ${columnInfo.description || columnName} (${columnInfo.type})${
            columnInfo.unit ? ` [${columnInfo.unit}]` : ""
          }`;

          const embedding = await this.embedText(text);
          results.push({
            id: columnId,
            text,
            embedding,
            metadata: {
              type: "column",
              table: tableName,
              column: columnName,
              data_type: columnInfo.type,
              description: columnInfo.description,
              unit: columnInfo.unit,
              aggregatable: columnInfo.aggregatable,
            },
          });
          count++;
        } catch (error) {
          console.error(`⚠️  Failed to embed column ${tableName}.${columnName}:`, error);
        }
      }
    }

    console.log(`✓ Embedded ${count} schema items (tables and columns)`);
    return results;
  }

  /**
   * Get embedding for a user query
   */
  async embedQuery(query: string): Promise<number[]> {
    return await this.embedText(query);
  }
}
