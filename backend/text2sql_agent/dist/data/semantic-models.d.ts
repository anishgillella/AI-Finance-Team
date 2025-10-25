/**
 * Semantic Models - Comprehensive Financial Query Patterns
 * 50+ SQL patterns covering all complexity levels for the Finance Agent
 */
export interface SemanticModel {
    id: string;
    name: string;
    description: string;
    sql: string;
    tables: string[];
    operations: string[];
    use_cases: string[];
    complexity: "simple" | "intermediate" | "complex" | "advanced";
    text: string;
}
export declare const SEMANTIC_MODELS: SemanticModel[];
export default SEMANTIC_MODELS;
//# sourceMappingURL=semantic-models.d.ts.map