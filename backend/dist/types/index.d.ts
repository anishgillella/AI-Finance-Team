export interface FinancialRecord {
    date: string;
    category: string;
    amount: number;
    description: string;
    type: 'income' | 'expense';
}
export interface KPI {
    name: string;
    value: number;
    unit: string;
    trend?: 'up' | 'down' | 'stable';
    percentChange?: number;
}
export interface AnalysisResult {
    kpis: KPI[];
    summary: string;
    insights: string[];
    anomalies: AnomalyDetection[];
}
export interface AnomalyDetection {
    date: string;
    category: string;
    amount: number;
    severity: 'low' | 'medium' | 'high';
    reason: string;
}
export interface EvaluationMetrics {
    accuracy: number;
    faithfulness: number;
    reasoning_quality: number;
    overall_score: number;
    feedback: string;
}
export interface FinanceAgentState {
    file_path?: string;
    data?: FinancialRecord[];
    analysis?: AnalysisResult;
    summary?: string;
    evaluation?: EvaluationMetrics;
    chat_history: Message[];
    error?: string;
}
export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}
export interface ChromaQuery {
    query_text: string;
    top_k: number;
    results: ChromaResult[];
}
export interface ChromaResult {
    id: string;
    document: string;
    distance: number;
    metadata?: Record<string, any>;
}
//# sourceMappingURL=index.d.ts.map