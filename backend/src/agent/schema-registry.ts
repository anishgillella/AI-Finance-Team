import dotenv from "dotenv";

// Load environment variables
dotenv.config();

let cachedSchema: FullSchema | null = null;

export interface ColumnInfo {
  type: string;
  description?: string;
  values?: string[];
  unit?: string;
  aggregatable?: string;
}

export interface Relationship {
  table: string;
  join_key: string;
}

export interface TableSchema {
  table_name: string;
  description: string;
  columns: Record<string, ColumnInfo>;
  relationships: Relationship[];
  sensitive_fields: string[];
}

export interface FullSchema {
  [tableName: string]: TableSchema;
}

/**
 * Load schema registry from database or use mock data
 */
export async function loadSchemaRegistry(): Promise<FullSchema> {
  if (cachedSchema) {
    console.log("✓ Using cached schema registry");
    return cachedSchema;
  }

  console.log("📋 Loading schema registry...");

  try {
    // Real schema data from Supabase public schema
    const mockData = [
      {
        table_name: "customers",
        description: "Customer profiles and company information",
        columns: {
          id: { type: "uuid", description: "Primary key" },
          phone_number: { type: "text", description: "Customer phone number", aggregatable: "false" },
          company_name: { type: "text", description: "Company name", aggregatable: "false" },
          industry: { type: "text", description: "Industry sector", aggregatable: "false" },
          location: { type: "text", description: "Geographic location", aggregatable: "false" },
          email: { type: "text", description: "Customer email address", aggregatable: "false" },
          first_name: { type: "text", description: "Customer first name", aggregatable: "false" },
          last_name: { type: "text", description: "Customer last name", aggregatable: "false" },
          created_at: { type: "timestamp", description: "Creation timestamp" },
          updated_at: { type: "timestamp", description: "Last update timestamp" },
        },
        relationships: [
          { table: "conversations", join_key: "id:customer_id" },
          { table: "customer_memory", join_key: "id:customer_id" },
        ],
        sensitive_fields: ["id", "email", "phone_number"],
      },
      {
        table_name: "conversations",
        description: "Customer conversation transcripts and metadata",
        columns: {
          id: { type: "uuid", description: "Primary key" },
          call_id: { type: "text", description: "Unique call identifier", aggregatable: "false" },
          customer_id: { type: "uuid", description: "Reference to customer" },
          transcript: { type: "text", description: "Full conversation transcript", aggregatable: "false" },
          created_at: { type: "timestamp", description: "Conversation timestamp" },
        },
        relationships: [
          { table: "customers", join_key: "customer_id:id" },
          { table: "customer_memory", join_key: "call_id:call_id" },
          { table: "embeddings", join_key: "call_id:call_id" },
        ],
        sensitive_fields: ["id", "customer_id", "transcript"],
      },
      {
        table_name: "analysis_results",
        description: "Financial analysis results with KPIs and anomalies",
        columns: {
          id: { type: "bigint", description: "Primary key" },
          upload_id: { type: "bigint", description: "Reference to uploaded file" },
          kpis: { type: "jsonb", description: "Key performance indicators as JSON", aggregatable: "false" },
          anomalies: { type: "jsonb", description: "Detected anomalies as JSON", aggregatable: "false" },
          created_at: { type: "timestamp", description: "Analysis timestamp" },
        },
        relationships: [
          { table: "uploads", join_key: "upload_id:id" },
          { table: "evaluations", join_key: "id:analysis_id" },
        ],
        sensitive_fields: ["id", "upload_id"],
      },
      {
        table_name: "uploads",
        description: "Uploaded financial data files",
        columns: {
          id: { type: "bigint", description: "Primary key" },
          file_name: { type: "text", description: "Name of uploaded file", aggregatable: "false" },
          record_count: { type: "integer", description: "Number of records in file", aggregatable: "SUM,AVG" },
          created_at: { type: "timestamp", description: "Upload timestamp" },
        },
        relationships: [
          { table: "analysis_results", join_key: "id:upload_id" },
        ],
        sensitive_fields: ["id"],
      },
      {
        table_name: "embeddings",
        description: "Vector embeddings for conversation analysis",
        columns: {
          call_id: { type: "text", description: "Reference to conversation call", aggregatable: "false" },
          embedding: { type: "vector", description: "1024-dimensional embedding vector", aggregatable: "false" },
          embedding_type: { type: "text", description: "Type of embedding (full, summary, etc)", aggregatable: "false" },
          created_at: { type: "timestamp", description: "Creation timestamp" },
        },
        relationships: [
          { table: "conversations", join_key: "call_id:call_id" },
        ],
        sensitive_fields: ["call_id", "embedding"],
      },
      {
        table_name: "customer_memory",
        description: "Persistent memory and context for customers",
        columns: {
          id: { type: "uuid", description: "Primary key" },
          customer_id: { type: "uuid", description: "Reference to customer" },
          call_id: { type: "text", description: "Reference to conversation call", aggregatable: "false" },
          memory_type: { type: "text", description: "Type of memory (preference, history, etc)", aggregatable: "false" },
          content: { type: "text", description: "Memory content", aggregatable: "false" },
          created_at: { type: "timestamp", description: "Creation timestamp" },
        },
        relationships: [
          { table: "customers", join_key: "customer_id:id" },
          { table: "conversations", join_key: "call_id:call_id" },
        ],
        sensitive_fields: ["id", "customer_id", "content"],
      },
      {
        table_name: "evaluations",
        description: "Quality evaluations of analysis results",
        columns: {
          id: { type: "bigint", description: "Primary key" },
          analysis_id: { type: "bigint", description: "Reference to analysis results" },
          accuracy: { type: "double", description: "Accuracy score 0-100", aggregatable: "AVG,MIN,MAX" },
          faithfulness: { type: "double", description: "Faithfulness score 0-100", aggregatable: "AVG,MIN,MAX" },
          reasoning_quality: { type: "double", description: "Reasoning quality score 0-100", aggregatable: "AVG,MIN,MAX" },
          overall_score: { type: "double", description: "Overall evaluation score 0-100", aggregatable: "AVG,MIN,MAX" },
          created_at: { type: "timestamp", description: "Evaluation timestamp" },
        },
        relationships: [
          { table: "analysis_results", join_key: "analysis_id:id" },
        ],
        sensitive_fields: ["id", "analysis_id"],
      },
    ] as any[];

    // Transform into usable schema object
    const schema: FullSchema = {};
    for (const table of mockData) {
      schema[table.table_name] = {
        table_name: table.table_name,
        description: table.description,
        columns: table.columns,
        relationships: table.relationships || [],
        sensitive_fields: table.sensitive_fields || [],
      };
    }

    cachedSchema = schema;
    console.log(`✓ Schema registry loaded: ${Object.keys(schema).length} tables`);
    return schema;
  } catch (error) {
    throw new Error(`Failed to load schema registry: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get formatted schema description for LLM
 */
export async function getSchemaDescription(): Promise<string> {
  const schema = await loadSchemaRegistry();

  let description = "# Finance Database Schema\n\n";

  for (const [tableName, tableSchema] of Object.entries(schema)) {
    description += `## Table: ${tableName}\n`;
    description += `${tableSchema.description}\n\n`;

    description += "### Columns:\n";
    for (const [colName, colInfo] of Object.entries(tableSchema.columns)) {
      description += `- \`${colName}\` (${colInfo.type})`;
      if (colInfo.description) {
        description += ` - ${colInfo.description}`;
      }
      if (colInfo.unit) {
        description += ` [${colInfo.unit}]`;
      }
      description += "\n";
    }

    if (tableSchema.relationships.length > 0) {
      description += "\n### Relationships:\n";
      for (const rel of tableSchema.relationships) {
        description += `- Joins to \`${rel.table}\` via \`${rel.join_key}\`\n`;
      }
    }

    description += "\n";
  }

  return description;
}

/**
 * Get a single table schema
 */
export async function getTableSchema(tableName: string): Promise<TableSchema | null> {
  const schema = await loadSchemaRegistry();
  return schema[tableName] || null;
}

/**
 * Get core schema subset (essential tables only for token optimization)
 * Used as fallback when semantic retrieval returns limited results
 */
export async function getCoreSchema(): Promise<FullSchema> {
  const fullSchema = await loadSchemaRegistry();
  const coreTableNames = ["customers", "conversations", "analysis_results"];
  
  const coreSchema: FullSchema = {};
  for (const tableName of coreTableNames) {
    if (fullSchema[tableName]) {
      coreSchema[tableName] = fullSchema[tableName];
    }
  }
  
  return coreSchema;
}

/**
 * Get core schema description (optimized for tokens)
 */
export async function getCoreSchemaDescription(): Promise<string> {
  const coreSchema = await getCoreSchema();
  let description = "## CORE SCHEMA (Optimized for Token Usage)\n\n";
  description += "Essential tables for financial analysis and customer interactions:\n\n";

  for (const tableName in coreSchema) {
    const tableSchema = coreSchema[tableName];
    description += `### \`${tableName}\` - ${tableSchema.description}\n`;
    description += "Columns: ";
    const columnNames = Object.keys(tableSchema.columns).slice(0, 8);
    description += columnNames.join(", ");
    if (Object.keys(tableSchema.columns).length > 8) {
      description += ` (+ ${Object.keys(tableSchema.columns).length - 8} more)`;
    }
    description += "\n\n";
  }

  return description;
}
