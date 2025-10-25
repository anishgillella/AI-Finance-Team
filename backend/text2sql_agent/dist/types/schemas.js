import { z } from 'zod';
export const FinancialRecordSchema = z.object({
    date: z.string().describe('Transaction date (ISO 8601)'),
    category: z.string().describe('Transaction category'),
    amount: z.number().describe('Transaction amount in USD'),
    description: z.string().describe('Transaction description'),
    type: z.enum(['income', 'expense']).describe('Transaction type')
});
export const KPISchema = z.object({
    name: z.string().describe('KPI name'),
    value: z.number().describe('Numeric value'),
    unit: z.string().describe('Unit of measurement'),
    trend: z.enum(['up', 'down', 'stable']).optional().describe('Trend direction'),
    percentChange: z.number().optional().describe('Percent change from previous period')
});
export const AnomalySchema = z.object({
    date: z.string().describe('Anomaly date'),
    category: z.string().describe('Category with anomaly'),
    amount: z.number().describe('Anomalous amount'),
    severity: z.enum(['low', 'medium', 'high']).describe('Anomaly severity'),
    reason: z.string().describe('Explanation for anomaly')
});
export const FinancialSummarySchema = z.object({
    executive_summary: z.string().describe('3-5 sentence executive summary'),
    key_findings: z.array(z.string()).describe('Top 3-5 key findings'),
    concerns: z.array(z.string()).describe('Areas of concern or risk'),
    recommendations: z.array(z.string()).describe('Actionable recommendations'),
    confidence_score: z.number().min(0).max(1).describe('Confidence in analysis (0-1)')
});
export const EvaluationResultSchema = z.object({
    accuracy: z.number().min(0).max(100).describe('Accuracy score'),
    faithfulness: z.number().min(0).max(100).describe('Faithfulness to source data'),
    reasoning_quality: z.number().min(0).max(100).describe('Quality of reasoning'),
    completeness: z.number().min(0).max(100).describe('Completeness of analysis'),
    overall_score: z.number().min(0).max(100).describe('Overall score'),
    feedback: z.string().describe('Detailed evaluation feedback'),
    strengths: z.array(z.string()).describe('Analysis strengths'),
    weaknesses: z.array(z.string()).describe('Analysis weaknesses')
});
export const QueryResponseSchema = z.object({
    answer: z.string().describe('Direct answer to query'),
    explanation: z.string().describe('Detailed explanation'),
    supporting_data: z.array(z.any()).optional().describe('Supporting KPIs/data'),
    confidence: z.number().min(0).max(1).describe('Confidence score'),
    caveats: z.array(z.string()).optional().describe('Important caveats or limitations')
});
//# sourceMappingURL=schemas.js.map