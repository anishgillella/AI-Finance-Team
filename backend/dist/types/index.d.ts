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
export interface UploadedFile {
    id: string;
    filename: string;
    file_path: string;
    file_size: number;
    upload_date: Date;
    record_count: number;
    date_range_start: Date;
    date_range_end: Date;
    status: 'processing' | 'completed' | 'failed';
    error_message?: string;
}
export interface Analysis {
    id: string;
    file_id: string;
    analysis_data: FinanceAgentState;
    created_at: Date;
    updated_at: Date;
}
export interface ChatSession {
    id: string;
    file_id: string;
    messages: Message[];
    created_at: Date;
    updated_at: Date;
}
export interface UploadResponse {
    success: boolean;
    file_id: string;
    filename: string;
    record_count: number;
    message?: string;
    error?: string;
}
export interface QueryRequest {
    file_id: string;
    query: string;
}
export interface QueryResponse {
    success: boolean;
    answer: string;
    analysis: AnalysisResult;
    evaluation: EvaluationMetrics;
    error?: string;
}
export interface AnalysisResponse {
    success: boolean;
    file_id: string;
    analysis: FinanceAgentState;
    error?: string;
}
//# sourceMappingURL=index.d.ts.map