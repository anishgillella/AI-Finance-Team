import { loadSchemaRegistry, getTableSchema, type FullSchema, type TableSchema } from "./schema-registry.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

interface TableReference {
  name: string;
  alias?: string;
}

interface ColumnReference {
  table: string;
  column: string;
  aggregationFunction?: string;
}

/**
 * Extract table names from SQL query
 */
function extractTableReferences(sql: string): TableReference[] {
  const tables: TableReference[] = [];

  // Match FROM, JOIN, and INTO clauses
  const fromRegex = /FROM\s+(\w+)\s*(?:AS\s+(\w+))?/gi;
  const joinRegex = /JOIN\s+(\w+)\s*(?:AS\s+(\w+))?/gi;
  const intoRegex = /INTO\s+(\w+)/gi;

  let match;

  while ((match = fromRegex.exec(sql)) !== null) {
    tables.push({ name: match[1], alias: match[2] });
  }

  while ((match = joinRegex.exec(sql)) !== null) {
    tables.push({ name: match[1], alias: match[2] });
  }

  while ((match = intoRegex.exec(sql)) !== null) {
    tables.push({ name: match[1] });
  }

  return tables;
}

/**
 * Extract column references from SQL query
 */
function extractColumnReferences(sql: string): ColumnReference[] {
  const columns: ColumnReference[] = [];

  // Match SELECT clause - handle both SELECT ... FROM and SELECT at end
  const selectRegex = /SELECT\s+(.+?)(?:\s+FROM|\s*$)/i;
  const selectMatch = selectRegex.exec(sql);

  if (selectMatch) {
    const selectPart = selectMatch[1];
    // Split by comma but be careful with function calls
    const columnParts = selectPart.split(/,(?![^()]*\))/);

    for (const part of columnParts) {
      const trimmed = part.trim();

      // Check for aggregation functions - more flexible regex
      const aggRegex = /(COUNT|SUM|AVG|MIN|MAX)\s*\(\s*(?:(\w+)\.)?(\w+|\*)\s*\)/i;
      const aggMatch = aggRegex.exec(trimmed);

      if (aggMatch) {
        columns.push({
          table: aggMatch[2] || "",
          column: aggMatch[3],
          aggregationFunction: aggMatch[1].toUpperCase(),
        });
      } else {
        // Regular column reference
        const colRegex = /(?:(\w+)\.)?(\w+)/;
        const colMatch = colRegex.exec(trimmed);

        if (colMatch) {
          const table = colMatch[1] || "";
          const column = colMatch[2];
          if (column && column !== "*") {
            columns.push({ table, column });
          }
        }
      }
    }
  }

  return columns;
}

/**
 * Check if table exists in schema
 */
function validateTableExists(
  tableName: string,
  schema: FullSchema,
  errors: string[]
): boolean {
  if (!schema[tableName]) {
    errors.push(
      `Table '${tableName}' does not exist. Available tables: ${Object.keys(schema).join(", ")}`
    );
    return false;
  }
  return true;
}

/**
 * Check if column exists in table
 */
function validateColumnExists(
  tableName: string,
  columnName: string,
  tableSchema: TableSchema,
  errors: string[]
): boolean {
  if (columnName === "*") {
    return true; // Allow SELECT *
  }

  if (!tableSchema.columns[columnName]) {
    const availableColumns = Object.keys(tableSchema.columns).join(", ");
    errors.push(
      `Column '${columnName}' does not exist in table '${tableName}'. Available columns: ${availableColumns}`
    );
    return false;
  }
  return true;
}

/**
 * Check if aggregation function is valid for column type
 */
function validateAggregation(
  tableName: string,
  columnName: string,
  aggregationFunction: string,
  tableSchema: TableSchema,
  errors: string[],
  warnings: string[]
): void {
  // Allow COUNT(*) without validation
  if (columnName === "*") {
    if (aggregationFunction !== "COUNT") {
      errors.push(
        `Cannot use ${aggregationFunction} on *. Only COUNT(*) is allowed.`
      );
    }
    return;
  }

  const column = tableSchema.columns[columnName];

  if (!column) {
    return; // Already reported in validateColumnExists
  }

  const validNumericAggregations = ["SUM", "AVG", "MIN", "MAX", "COUNT"];
  const validTextAggregations = ["COUNT", "DISTINCT"];

  if (column.type === "text" && !validTextAggregations.includes(aggregationFunction)) {
    errors.push(
      `Cannot use ${aggregationFunction} on text column '${tableName}.${columnName}'. Use COUNT or DISTINCT instead.`
    );
  }

  if (column.type === "date" && !["MIN", "MAX", "COUNT"].includes(aggregationFunction)) {
    errors.push(
      `Cannot use ${aggregationFunction} on date column '${tableName}.${columnName}'. Use MIN, MAX, or COUNT instead.`
    );
  }

  if (column.type === "uuid" && aggregationFunction !== "COUNT" && aggregationFunction !== "DISTINCT") {
    errors.push(
      `Cannot use ${aggregationFunction} on UUID column '${tableName}.${columnName}'. Use COUNT or DISTINCT instead.`
    );
  }

  // Warn if trying to aggregate non-aggregatable column
  if (
    column.aggregatable && column.aggregatable === "false" &&
    aggregationFunction !== "COUNT" &&
    aggregationFunction !== "DISTINCT"
  ) {
    warnings.push(
      `Column '${tableName}.${columnName}' is not typically aggregatable. Verify this is intentional.`
    );
  }
}

/**
 * Check for dangerous operations
 */
function validateSafety(sql: string, errors: string[]): void {
  const dangerousKeywords = ["DELETE", "DROP", "TRUNCATE", "ALTER", "GRANT", "REVOKE"];

  for (const keyword of dangerousKeywords) {
    if (new RegExp(`\\b${keyword}\\b`, "i").test(sql)) {
      errors.push(
        `Dangerous operation detected: ${keyword}. Only SELECT queries are allowed.`
      );
    }
  }
}

/**
 * Check for common SQL hallucinations
 */
function detectHallucinations(
  sql: string,
  schema: FullSchema,
  errors: string[],
  suggestions: string[]
): void {
  // Check for common hallucinations like:
  // - Referencing non-existent schema
  // - Using undefined aliases
  // - Invalid WHERE conditions

  // Check for schema prefix usage (e.g., "public.table_name")
  const schemaRegex = /\b(\w+)\.\w+/g;
  let match;

  while ((match = schemaRegex.exec(sql)) !== null) {
    const possibleSchema = match[1];
    if (possibleSchema !== "public" && !schema[possibleSchema]) {
      // This might be a table alias or column reference, not necessarily wrong
      // Just warn
      suggestions.push(
        `Verify that '${possibleSchema}' is a valid table alias or fully qualified name.`
      );
    }
  }

  // Check for common typos in keywords
  if (/FORM\b/i.test(sql)) {
    suggestions.push("Did you mean 'FROM' instead of 'FORM'?");
  }

  if (/SELECTE\b/i.test(sql)) {
    suggestions.push("Did you mean 'SELECT' instead of 'SELECTE'?");
  }

  if (/WHER\b/i.test(sql)) {
    suggestions.push("Did you mean 'WHERE' instead of 'WHER'?");
  }
}

/**
 * Main query validator function
 */
export async function validateQuery(sql: string): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  try {
    // Load schema
    const schema = await loadSchemaRegistry();

    // Check for dangerous operations
    validateSafety(sql, errors);

    // Extract table references
    const tableReferences = extractTableReferences(sql);

    if (tableReferences.length === 0) {
      errors.push("No tables found in query. Did you forget a FROM clause?");
    }

    // Validate tables exist
    for (const tableRef of tableReferences) {
      if (tableRef.name && !validateTableExists(tableRef.name, schema, errors)) {
        continue;
      }

      const tableSchema = schema[tableRef.name];
      if (!tableSchema) continue;

      // Extract and validate columns for this table
      const columnReferences = extractColumnReferences(sql);

      for (const colRef of columnReferences) {
        // Skip if no table specified and multiple tables referenced
        if (!colRef.table && tableReferences.length > 1) {
          continue;
        }

        // Use the specified table or the only table if one exists
        const targetTable = colRef.table || tableRef.name;

        if (!schema[targetTable]) {
          continue; // Already reported
        }

        // Validate column exists
        validateColumnExists(targetTable, colRef.column, schema[targetTable], errors);

        // Validate aggregation if present
        if (colRef.aggregationFunction) {
          validateAggregation(
            targetTable,
            colRef.column,
            colRef.aggregationFunction,
            schema[targetTable],
            errors,
            warnings
          );
        }
      }
    }

    // Detect hallucinations
    detectHallucinations(sql, schema, errors, suggestions);

    // Check for basic syntax issues
    if (!sql.includes("SELECT") && !sql.includes("select")) {
      errors.push("Query must include a SELECT clause");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Validation error: ${error instanceof Error ? error.message : String(error)}`],
      warnings,
      suggestions,
    };
  }
}

/**
 * Format validation result for display
 */
export function formatValidationResult(result: ValidationResult): string {
  let output = "";

  if (result.valid) {
    output += "✅ Query is valid\n";
  } else {
    output += "❌ Query has errors:\n";
    for (const error of result.errors) {
      output += `  • ${error}\n`;
    }
  }

  if (result.warnings.length > 0) {
    output += "\n⚠️  Warnings:\n";
    for (const warning of result.warnings) {
      output += `  • ${warning}\n`;
    }
  }

  if (result.suggestions.length > 0) {
    output += "\n💡 Suggestions:\n";
    for (const suggestion of result.suggestions) {
      output += `  • ${suggestion}\n`;
    }
  }

  return output;
}
