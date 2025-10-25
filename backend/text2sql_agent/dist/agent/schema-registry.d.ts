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
export declare function loadSchemaRegistry(): Promise<FullSchema>;
/**
 * Get full schema description for LLM prompts
 */
export declare function getSchemaDescription(): Promise<string>;
/**
 * Get core schema description - optimized for token usage
 */
export declare function getCoreSchemaDescription(): Promise<string>;
/**
 * Get schema by table name
 */
export declare function getTableSchema(tableName: string): Promise<TableSchema | null>;
/**
 * Validate table name exists in schema
 */
export declare function validateTableName(tableName: string): Promise<boolean>;
/**
 * Validate column exists in table
 */
export declare function validateColumn(tableName: string, columnName: string): Promise<boolean>;
/**
 * Get all table names
 */
export declare function getTableNames(): Promise<string[]>;
/**
 * Check if column is aggregatable
 */
export declare function isColumnAggregatable(tableName: string, columnName: string): Promise<boolean>;
export default loadSchemaRegistry;
//# sourceMappingURL=schema-registry.d.ts.map