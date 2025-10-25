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
    // Mock schema data - matches the actual database schema for FINANCE project
    const mockData = [
      {
        table_name: "users",
        description: "User financial profiles",
        columns: {
          id: { type: "uuid", description: "Primary key" },
          email: { type: "text", description: "User email" },
          name: { type: "text", description: "User name" },
          phone: { type: "text", description: "User phone" },
          country: { type: "text", description: "User country" },
          created_at: { type: "timestamp", description: "Creation timestamp" },
          updated_at: { type: "timestamp", description: "Last update timestamp" },
        },
        relationships: [{ table: "accounts", join_key: "id:user_id" }],
        sensitive_fields: ["id", "email", "phone"],
      },
      {
        table_name: "accounts",
        description: "Financial accounts",
        columns: {
          id: { type: "uuid", description: "Primary key" },
          user_id: { type: "uuid", description: "User reference" },
          account_type: { type: "text", description: "Type of account" },
          account_name: { type: "text", description: "Account display name" },
          balance: { type: "numeric", description: "Current balance", unit: "USD", aggregatable: "SUM,AVG" },
          currency: { type: "text", description: "Currency code" },
          account_number: { type: "text", description: "Account number" },
          institution_name: { type: "text", description: "Financial institution" },
          created_at: { type: "timestamp", description: "Creation timestamp" },
          updated_at: { type: "timestamp", description: "Last update timestamp" },
        },
        relationships: [
          { table: "users", join_key: "user_id:id" },
          { table: "transactions", join_key: "id:account_id" },
          { table: "portfolio_holdings", join_key: "id:account_id" },
        ],
        sensitive_fields: ["id", "user_id", "account_number"],
      },
      {
        table_name: "securities",
        description: "Investment securities (stocks, ETFs, bonds, etc.)",
        columns: {
          id: { type: "uuid", description: "Primary key" },
          ticker: { type: "text", description: "Stock ticker symbol" },
          name: { type: "text", description: "Security name" },
          security_type: { type: "text", description: "Type (stock, etf, bond, etc.)" },
          sector: { type: "text", description: "Industry sector" },
          industry: { type: "text", description: "Specific industry" },
          market_cap: { type: "numeric", description: "Market capitalization", unit: "USD" },
          description: { type: "text", description: "Company description" },
          created_at: { type: "timestamp", description: "Creation timestamp" },
          updated_at: { type: "timestamp", description: "Last update timestamp" },
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
        table_name: "transactions",
        description: "Financial transactions (trades, deposits, withdrawals)",
        columns: {
          id: { type: "uuid", description: "Primary key" },
          account_id: { type: "uuid", description: "Account reference" },
          security_id: { type: "uuid", description: "Security reference (optional)" },
          transaction_type: { type: "text", description: "Type of transaction" },
          amount: { type: "numeric", description: "Transaction amount", unit: "USD", aggregatable: "SUM,AVG,COUNT" },
          quantity: { type: "numeric", description: "Quantity (for trades)" },
          price_per_unit: { type: "numeric", description: "Price per unit" },
          transaction_date: { type: "date", description: "Date of transaction" },
          description: { type: "text", description: "Transaction description" },
          category: { type: "text", description: "Transaction category", aggregatable: "true" },
          merchant: { type: "text", description: "Merchant/counterparty" },
          status: { type: "text", description: "Transaction status" },
          created_at: { type: "timestamp", description: "Creation timestamp" },
        },
        relationships: [
          { table: "accounts", join_key: "account_id:id" },
          { table: "securities", join_key: "security_id:id" },
        ],
        sensitive_fields: ["id", "account_id"],
      },
      {
        table_name: "portfolio_holdings",
        description: "Current investment holdings",
        columns: {
          id: { type: "uuid", description: "Primary key" },
          account_id: { type: "uuid", description: "Account reference" },
          security_id: { type: "uuid", description: "Security reference" },
          quantity: { type: "numeric", description: "Number of shares held", aggregatable: "SUM,AVG" },
          average_cost: { type: "numeric", description: "Average cost per share", unit: "USD" },
          current_price: { type: "numeric", description: "Current market price", unit: "USD" },
          market_value: { type: "numeric", description: "Total market value", unit: "USD", aggregatable: "SUM,AVG" },
          acquisition_date: { type: "date", description: "Date acquired" },
          created_at: { type: "timestamp", description: "Creation timestamp" },
          updated_at: { type: "timestamp", description: "Last update timestamp" },
        },
        relationships: [
          { table: "accounts", join_key: "account_id:id" },
          { table: "securities", join_key: "security_id:id" },
        ],
        sensitive_fields: ["id"],
      },
      {
        table_name: "price_history",
        description: "Historical price data (OHLCV)",
        columns: {
          id: { type: "uuid", description: "Primary key" },
          security_id: { type: "uuid", description: "Security reference" },
          history_date: { type: "date", description: "Date of price data" },
          open_price: { type: "numeric", description: "Opening price", unit: "USD" },
          close_price: { type: "numeric", description: "Closing price", unit: "USD" },
          high_price: { type: "numeric", description: "High price of the day", unit: "USD" },
          low_price: { type: "numeric", description: "Low price of the day", unit: "USD" },
          volume: { type: "bigint", description: "Trading volume" },
          created_at: { type: "timestamp", description: "Creation timestamp" },
        },
        relationships: [{ table: "securities", join_key: "security_id:id" }],
        sensitive_fields: ["id"],
      },
      {
        table_name: "dividends",
        description: "Dividend payment records",
        columns: {
          id: { type: "uuid", description: "Primary key" },
          security_id: { type: "uuid", description: "Security reference" },
          account_id: { type: "uuid", description: "Account reference" },
          ex_date: { type: "date", description: "Ex-dividend date" },
          record_date: { type: "date", description: "Record date" },
          payment_date: { type: "date", description: "Payment date" },
          amount_per_share: { type: "numeric", description: "Dividend per share", unit: "USD" },
          total_amount: { type: "numeric", description: "Total dividend amount", unit: "USD", aggregatable: "SUM" },
          created_at: { type: "timestamp", description: "Creation timestamp" },
        },
        relationships: [
          { table: "securities", join_key: "security_id:id" },
          { table: "accounts", join_key: "account_id:id" },
        ],
        sensitive_fields: ["id"],
      },
      {
        table_name: "budgets",
        description: "Monthly spending budgets",
        columns: {
          id: { type: "uuid", description: "Primary key" },
          user_id: { type: "uuid", description: "User reference" },
          category: { type: "text", description: "Budget category", aggregatable: "true" },
          limit_amount: { type: "numeric", description: "Budget limit", unit: "USD", aggregatable: "SUM" },
          spent_amount: { type: "numeric", description: "Amount spent", unit: "USD", aggregatable: "SUM" },
          budget_month: { type: "integer", description: "Month (1-12)" },
          budget_year: { type: "integer", description: "Year" },
          created_at: { type: "timestamp", description: "Creation timestamp" },
          updated_at: { type: "timestamp", description: "Last update timestamp" },
        },
        relationships: [{ table: "users", join_key: "user_id:id" }],
        sensitive_fields: ["user_id"],
      },
      {
        table_name: "financial_goals",
        description: "User financial goals and targets",
        columns: {
          id: { type: "uuid", description: "Primary key" },
          user_id: { type: "uuid", description: "User reference" },
          goal_name: { type: "text", description: "Name of the goal" },
          goal_type: { type: "text", description: "Type of goal (savings, investment, retirement, etc.)" },
          target_amount: { type: "numeric", description: "Target amount", unit: "USD" },
          current_amount: { type: "numeric", description: "Current amount", unit: "USD" },
          target_date: { type: "date", description: "Target completion date" },
          priority: { type: "text", description: "Priority level" },
          status: { type: "text", description: "Goal status" },
          created_at: { type: "timestamp", description: "Creation timestamp" },
          updated_at: { type: "timestamp", description: "Last update timestamp" },
        },
        relationships: [{ table: "users", join_key: "user_id:id" }],
        sensitive_fields: ["user_id"],
      },
      {
        table_name: "expense_categories",
        description: "Custom expense categories",
        columns: {
          id: { type: "uuid", description: "Primary key" },
          user_id: { type: "uuid", description: "User reference" },
          category_name: { type: "text", description: "Category name" },
          color: { type: "text", description: "Color code for UI" },
          icon: { type: "text", description: "Icon emoji or reference" },
          description: { type: "text", description: "Category description" },
          created_at: { type: "timestamp", description: "Creation timestamp" },
        },
        relationships: [{ table: "users", join_key: "user_id:id" }],
        sensitive_fields: ["user_id"],
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
