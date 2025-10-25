export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
}
/**
 * Main query validator function
 */
export declare function validateQuery(sql: string): Promise<ValidationResult>;
/**
 * Format validation result for display
 */
export declare function formatValidationResult(result: ValidationResult): string;
//# sourceMappingURL=query-validator.d.ts.map