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
    // Real schema data from Supabase public schema - Finance Management System
    const mockData: TableSchema[] = [
      {
        table_name: "users",
        description: "User profiles and authentication data",
        columns: {
          id: { type: "uuid", description: "Primary key" },
          email: { type: "text", description: "User email address", aggregatable: "false" },
          name: { type: "text", description: "User full name", aggregatable: "false" },
          phone: { type: "text", description: "User phone number", aggregatable: "false" },
          country: { type: "text", description: "User country", aggregatable: "false" },
          role: { type: "varchar", description: "User role", aggregatable: "false" },
          created_at: { type: "timestamp", description: "Account creation timestamp" },
          updated_at: { type: "timestamp", description: "Last update timestamp" },
        },
        relationships: [
          { table: "accounts", join_key: "id:user_id" },
          { table: "budgets", join_key: "id:user_id" },
          { table: "financial_goals", join_key: "id:user_id" },
          { table: "expense_categories", join_key: "id:user_id" },
        ],
        sensitive_fields: ["id", "email", "phone"],
      },
      {
        table_name: "accounts",
        description: "Bank and investment accounts",
        columns: {
          id: { type: "uuid", description: "Primary key" },
          user_id: { type: "uuid", description: "Reference to user" },
          account_type: { type: "text", description: "Type of account (checking, savings, investment)", aggregatable: "false" },
          account_name: { type: "text", description: "Name of the account", aggregatable: "false" },
          balance: { type: "numeric", description: "Current account balance", aggregatable: "SUM,AVG,MAX,MIN" },
          currency: { type: "text", description: "Currency code (USD, EUR, etc)", aggregatable: "false" },
          account_number: { type: "text", description: "Account number", aggregatable: "false" },
          institution_name: { type: "text", description: "Name of financial institution", aggregatable: "false" },
          created_at: { type: "timestamp", description: "Account creation timestamp" },
          updated_at: { type: "timestamp", description: "Last update timestamp" },
        },
        relationships: [
          { table: "users", join_key: "user_id:id" },
          { table: "transactions", join_key: "id:account_id" },
          { table: "portfolio_holdings", join_key: "id:account_id" },
          { table: "dividends", join_key: "id:account_id" },
        ],
        sensitive_fields: ["id", "user_id", "account_number"],
      },
      {
        table_name: "transactions",
        description: "Financial transactions including purchases, sales, and transfers",
        columns: {
          id: { type: "uuid", description: "Primary key" },
          account_id: { type: "uuid", description: "Reference to account" },
          security_id: { type: "uuid", description: "Reference to security if investment transaction" },
          transaction_type: { type: "text", description: "Type of transaction (buy, sell, transfer, deposit, withdrawal)", aggregatable: "false" },
          amount: { type: "numeric", description: "Transaction amount", aggregatable: "SUM,AVG,MAX,MIN" },
          quantity: { type: "numeric", description: "Quantity for securities transactions", aggregatable: "SUM" },
          price_per_unit: { type: "numeric", description: "Price per unit for securities", aggregatable: "AVG" },
          transaction_date: { type: "date", description: "Date of transaction" },
          description: { type: "text", description: "Transaction description", aggregatable: "false" },
          category: { type: "text", description: "Transaction category", aggregatable: "false" },
          merchant: { type: "text", description: "Merchant name if applicable", aggregatable: "false" },
          status: { type: "text", description: "Transaction status (pending, completed, failed)", aggregatable: "false" },
          created_at: { type: "timestamp", description: "Record creation timestamp" },
        },
        relationships: [
          { table: "accounts", join_key: "account_id:id" },
          { table: "securities", join_key: "security_id:id" },
        ],
        sensitive_fields: ["id", "account_id"],
      },
      {
        table_name: "securities",
        description: "Stocks, bonds, mutual funds, and other investment securities",
        columns: {
          id: { type: "uuid", description: "Primary key" },
          ticker: { type: "text", description: "Security ticker symbol", aggregatable: "false" },
          name: { type: "text", description: "Security name", aggregatable: "false" },
          security_type: { type: "text", description: "Type of security (stock, bond, etf, mutual fund)", aggregatable: "false" },
          sector: { type: "text", description: "Industry sector", aggregatable: "false" },
          industry: { type: "text", description: "Industry classification", aggregatable: "false" },
          market_cap: { type: "numeric", description: "Market capitalization", aggregatable: "SUM,AVG,MAX,MIN" },
          description: { type: "text", description: "Security description", aggregatable: "false" },
          created_at: { type: "timestamp", description: "Record creation timestamp" },
        },
        relationships: [
          { table: "portfolio_holdings", join_key: "id:security_id" },
          { table: "transactions", join_key: "id:security_id" },
          { table: "price_history", join_key: "id:security_id" },
          { table: "dividends", join_key: "id:security_id" },
        ],
        sensitive_fields: ["id"],
      },
      {
        table_name: "portfolio_holdings",
        description: "Current portfolio holdings of users",
        columns: {
          id: { type: "uuid", description: "Primary key" },
          account_id: { type: "uuid", description: "Reference to account" },
          security_id: { type: "uuid", description: "Reference to security" },
          quantity: { type: "numeric", description: "Number of shares held", aggregatable: "SUM" },
          average_cost: { type: "numeric", description: "Average cost basis per share", aggregatable: "AVG" },
          current_price: { type: "numeric", description: "Current price per share", aggregatable: "AVG" },
          market_value: { type: "numeric", description: "Total market value of holding", aggregatable: "SUM,AVG" },
          acquisition_date: { type: "date", description: "Date of initial purchase" },
          created_at: { type: "timestamp", description: "Record creation timestamp" },
          updated_at: { type: "timestamp", description: "Last update timestamp" },
        },
        relationships: [
          { table: "accounts", join_key: "account_id:id" },
          { table: "securities", join_key: "security_id:id" },
        ],
        sensitive_fields: ["id", "account_id"],
      },
      {
        table_name: "price_history",
        description: "Historical stock price data",
        columns: {
          id: { type: "uuid", description: "Primary key" },
          security_id: { type: "uuid", description: "Reference to security" },
          history_date: { type: "date", description: "Date of price data" },
          open_price: { type: "numeric", description: "Opening price", aggregatable: "AVG" },
          close_price: { type: "numeric", description: "Closing price", aggregatable: "AVG" },
          high_price: { type: "numeric", description: "High price for the day", aggregatable: "MAX" },
          low_price: { type: "numeric", description: "Low price for the day", aggregatable: "MIN" },
          volume: { type: "bigint", description: "Trading volume", aggregatable: "SUM,AVG" },
          created_at: { type: "timestamp", description: "Record creation timestamp" },
        },
        relationships: [
          { table: "securities", join_key: "security_id:id" },
        ],
        sensitive_fields: ["id"],
      },
      {
        table_name: "dividends",
        description: "Dividend payments from securities",
        columns: {
          id: { type: "uuid", description: "Primary key" },
          security_id: { type: "uuid", description: "Reference to security" },
          account_id: { type: "uuid", description: "Reference to account" },
          ex_date: { type: "date", description: "Ex-dividend date" },
          record_date: { type: "date", description: "Record date for dividend eligibility" },
          payment_date: { type: "date", description: "Date dividend was paid" },
          amount_per_share: { type: "numeric", description: "Dividend amount per share", aggregatable: "AVG" },
          total_amount: { type: "numeric", description: "Total dividend amount received", aggregatable: "SUM" },
          created_at: { type: "timestamp", description: "Record creation timestamp" },
        },
        relationships: [
          { table: "securities", join_key: "security_id:id" },
          { table: "accounts", join_key: "account_id:id" },
        ],
        sensitive_fields: ["id"],
      },
      {
        table_name: "budgets",
        description: "User budgets for expense categories",
        columns: {
          id: { type: "uuid", description: "Primary key" },
          user_id: { type: "uuid", description: "Reference to user" },
          category: { type: "text", description: "Budget category", aggregatable: "false" },
          limit_amount: { type: "numeric", description: "Budget limit amount", aggregatable: "SUM" },
          spent_amount: { type: "numeric", description: "Amount spent so far", aggregatable: "SUM" },
          budget_month: { type: "integer", description: "Budget month (1-12)", aggregatable: "false" },
          budget_year: { type: "integer", description: "Budget year", aggregatable: "false" },
          created_at: { type: "timestamp", description: "Record creation timestamp" },
          updated_at: { type: "timestamp", description: "Last update timestamp" },
        },
        relationships: [
          { table: "users", join_key: "user_id:id" },
        ],
        sensitive_fields: ["id", "user_id"],
      },
      {
        table_name: "expense_categories",
        description: "Custom expense categories for users",
        columns: {
          id: { type: "uuid", description: "Primary key" },
          user_id: { type: "uuid", description: "Reference to user" },
          category_name: { type: "text", description: "Category name", aggregatable: "false" },
          color: { type: "text", description: "Display color for category", aggregatable: "false" },
          icon: { type: "text", description: "Icon identifier", aggregatable: "false" },
          description: { type: "text", description: "Category description", aggregatable: "false" },
          created_at: { type: "timestamp", description: "Record creation timestamp" },
        },
        relationships: [
          { table: "users", join_key: "user_id:id" },
        ],
        sensitive_fields: ["id", "user_id"],
      },
      {
        table_name: "financial_goals",
        description: "Financial goals and targets for users",
        columns: {
          id: { type: "uuid", description: "Primary key" },
          user_id: { type: "uuid", description: "Reference to user" },
          goal_name: { type: "text", description: "Name of the financial goal", aggregatable: "false" },
          goal_type: { type: "text", description: "Type of goal (savings, investment, debt payoff)", aggregatable: "false" },
          target_amount: { type: "numeric", description: "Target amount to achieve", aggregatable: "SUM" },
          current_amount: { type: "numeric", description: "Current progress towards goal", aggregatable: "SUM" },
          target_date: { type: "date", description: "Target date to achieve goal" },
          priority: { type: "text", description: "Priority level (low, medium, high)", aggregatable: "false" },
          status: { type: "text", description: "Goal status (active, completed, paused)", aggregatable: "false" },
          created_at: { type: "timestamp", description: "Record creation timestamp" },
          updated_at: { type: "timestamp", description: "Last update timestamp" },
        },
        relationships: [
          { table: "users", join_key: "user_id:id" },
        ],
        sensitive_fields: ["id", "user_id"],
      },
      {
        table_name: "schema_registry",
        description: "Registry of queryable schemas and metadata",
        columns: {
          id: { type: "uuid", description: "Primary key" },
          table_name: { type: "text", description: "Table name", aggregatable: "false" },
          description: { type: "text", description: "Table description", aggregatable: "false" },
          col_defs: { type: "jsonb", description: "Column definitions as JSON", aggregatable: "false" },
          rel_defs: { type: "jsonb", description: "Relationship definitions as JSON", aggregatable: "false" },
          sens_fields: { type: "array", description: "Array of sensitive field names", aggregatable: "false" },
          is_queryable: { type: "boolean", description: "Whether table is queryable by agents", aggregatable: "false" },
          created_at: { type: "timestamp", description: "Record creation timestamp" },
          updated_at: { type: "timestamp", description: "Last update timestamp" },
        },
        relationships: [],
        sensitive_fields: ["id"],
      },
    ];

    cachedSchema = {};
    for (const table of mockData) {
      cachedSchema[table.table_name] = table;
    }

    console.log(`✓ Schema registry loaded: ${Object.keys(cachedSchema).length} tables`);
    return cachedSchema;
  } catch (error) {
    console.error("Error loading schema registry:", error);
    throw new Error("Failed to load schema registry");
  }
}

/**
 * Get full schema description for LLM prompts
 */
export async function getSchemaDescription(): Promise<string> {
  const schema = await loadSchemaRegistry();
  let description = "## COMPLETE DATABASE SCHEMA\n\n";

  for (const tableName in schema) {
    const tableSchema = schema[tableName];
    description += `### \`${tableName}\` - ${tableSchema.description}\n`;

    // Columns
    description += "**Columns:**\n";
    for (const colName in tableSchema.columns) {
      const col = tableSchema.columns[colName];
      const agg = col.aggregatable ? ` [${col.aggregatable}]` : "";
      description += `- \`${colName}\` (${col.type})${agg}: ${col.description || ""}\n`;
    }

    // Relationships
    if (tableSchema.relationships.length > 0) {
      description += "**Relationships:**\n";
      for (const rel of tableSchema.relationships) {
        description += `- ${rel.join_key} → \`${rel.table}\`\n`;
      }
    }

    description += "\n";
  }

  return description;
}

/**
 * Get core schema description - optimized for token usage
 */
export async function getCoreSchemaDescription(): Promise<string> {
  const schema = await loadSchemaRegistry();
  let description = "## CORE SCHEMA (Optimized for Token Usage)\n\n";
  description += "Primary financial tables for analysis:\n\n";

  // Focus on main tables
  const coreTables = ["users", "accounts", "transactions", "securities", "portfolio_holdings"];

  for (const tableName of coreTables) {
    if (!schema[tableName]) continue;
    const tableSchema = schema[tableName];
    description += `### \`${tableName}\` - ${tableSchema.description}\n`;

    // Show only key columns
    const keyColumns = Object.keys(tableSchema.columns).slice(0, 10);
    description += "Key columns: " + keyColumns.join(", ") + "\n";

    // Key relationships
    if (tableSchema.relationships.length > 0) {
      description += "Joins with: " + tableSchema.relationships.map((r) => r.table).join(", ") + "\n";
    }

    description += "\n";
  }

  return description;
}

/**
 * Get schema by table name
 */
export async function getTableSchema(tableName: string): Promise<TableSchema | null> {
  const schema = await loadSchemaRegistry();
  return schema[tableName] || null;
}

/**
 * Validate table name exists in schema
 */
export async function validateTableName(tableName: string): Promise<boolean> {
  const schema = await loadSchemaRegistry();
  return tableName in schema;
}

/**
 * Validate column exists in table
 */
export async function validateColumn(tableName: string, columnName: string): Promise<boolean> {
  const schema = await loadSchemaRegistry();
  const table = schema[tableName];
  return table ? columnName in table.columns : false;
}

/**
 * Get all table names
 */
export async function getTableNames(): Promise<string[]> {
  const schema = await loadSchemaRegistry();
  return Object.keys(schema);
}

/**
 * Check if column is aggregatable
 */
export async function isColumnAggregatable(tableName: string, columnName: string): Promise<boolean> {
  const schema = await loadSchemaRegistry();
  const table = schema[tableName];
  if (!table || !table.columns[columnName]) return false;
  return table.columns[columnName].aggregatable !== "false" && !!table.columns[columnName].aggregatable;
}

export default loadSchemaRegistry;
