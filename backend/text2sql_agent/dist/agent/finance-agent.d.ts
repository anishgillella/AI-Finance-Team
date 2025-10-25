import { type TokenUsage } from "./sql-generator.js";
export interface ConversationMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    tokens?: {
        prompt: number;
        completion: number;
        total: number;
    };
}
export interface AgentResponse {
    query: string;
    reasoning: string;
    sql: string;
    isValid: boolean;
    rawData: any[];
    summary: string;
    insights: string[];
    tokens: TokenUsage;
    conversationHistory: ConversationMessage[];
    executionSteps: string[];
    semanticContext?: {
        tokensEstimated: number;
        modelsUsed: number;
        columnsUsed: number;
    };
    errors?: string[];
}
export declare class AgentException extends Error {
    code: string;
    constructor(code: string, message: string);
}
export declare class SQLGenerationException extends AgentException {
    constructor(message: string);
}
export declare class ValidationException extends AgentException {
    constructor(message: string);
}
export declare class ExecutionException extends AgentException {
    constructor(message: string);
}
export declare class NoResultsException extends AgentException {
    constructor(message: string);
}
/**
 * Main Finance Agent - Functional Pipeline
 */
export declare function runFinanceAgent(userQuery: string, conversationHistory?: ConversationMessage[]): Promise<AgentResponse>;
//# sourceMappingURL=finance-agent.d.ts.map