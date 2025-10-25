export interface TokenUsage {
    totalTokens: number;
    totalCost: number;
}
export interface GeneratedSQL {
    sql: string;
    reasoning: string;
    tokensUsed: number;
}
export declare function generateSQL(userQuery: string, semanticContext?: string): Promise<GeneratedSQL>;
export declare function getTokenUsage(): TokenUsage;
export declare function resetTokenUsage(): void;
export declare function formatTokenUsageSummary(): string;
export default generateSQL;
//# sourceMappingURL=sql-generator.d.ts.map