import { z } from 'zod';
export declare const FinancialRecordSchema: z.ZodObject<{
    date: z.ZodString;
    category: z.ZodString;
    amount: z.ZodNumber;
    description: z.ZodString;
    type: z.ZodEnum<["income", "expense"]>;
}, "strip", z.ZodTypeAny, {
    description: string;
    type: "income" | "expense";
    date: string;
    category: string;
    amount: number;
}, {
    description: string;
    type: "income" | "expense";
    date: string;
    category: string;
    amount: number;
}>;
export declare const KPISchema: z.ZodObject<{
    name: z.ZodString;
    value: z.ZodNumber;
    unit: z.ZodString;
    trend: z.ZodOptional<z.ZodEnum<["up", "down", "stable"]>>;
    percentChange: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    unit: string;
    value: number;
    trend?: "up" | "down" | "stable" | undefined;
    percentChange?: number | undefined;
}, {
    name: string;
    unit: string;
    value: number;
    trend?: "up" | "down" | "stable" | undefined;
    percentChange?: number | undefined;
}>;
export declare const AnomalySchema: z.ZodObject<{
    date: z.ZodString;
    category: z.ZodString;
    amount: z.ZodNumber;
    severity: z.ZodEnum<["low", "medium", "high"]>;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    date: string;
    category: string;
    amount: number;
    severity: "high" | "low" | "medium";
    reason: string;
}, {
    date: string;
    category: string;
    amount: number;
    severity: "high" | "low" | "medium";
    reason: string;
}>;
export declare const FinancialSummarySchema: z.ZodObject<{
    executive_summary: z.ZodString;
    key_findings: z.ZodArray<z.ZodString, "many">;
    concerns: z.ZodArray<z.ZodString, "many">;
    recommendations: z.ZodArray<z.ZodString, "many">;
    confidence_score: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    executive_summary: string;
    key_findings: string[];
    concerns: string[];
    recommendations: string[];
    confidence_score: number;
}, {
    executive_summary: string;
    key_findings: string[];
    concerns: string[];
    recommendations: string[];
    confidence_score: number;
}>;
export declare const EvaluationResultSchema: z.ZodObject<{
    accuracy: z.ZodNumber;
    faithfulness: z.ZodNumber;
    reasoning_quality: z.ZodNumber;
    completeness: z.ZodNumber;
    overall_score: z.ZodNumber;
    feedback: z.ZodString;
    strengths: z.ZodArray<z.ZodString, "many">;
    weaknesses: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    accuracy: number;
    faithfulness: number;
    reasoning_quality: number;
    completeness: number;
    overall_score: number;
    feedback: string;
    strengths: string[];
    weaknesses: string[];
}, {
    accuracy: number;
    faithfulness: number;
    reasoning_quality: number;
    completeness: number;
    overall_score: number;
    feedback: string;
    strengths: string[];
    weaknesses: string[];
}>;
export declare const QueryResponseSchema: z.ZodObject<{
    answer: z.ZodString;
    explanation: z.ZodString;
    supporting_data: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    confidence: z.ZodNumber;
    caveats: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    answer: string;
    explanation: string;
    confidence: number;
    supporting_data?: any[] | undefined;
    caveats?: string[] | undefined;
}, {
    answer: string;
    explanation: string;
    confidence: number;
    supporting_data?: any[] | undefined;
    caveats?: string[] | undefined;
}>;
export type FinancialRecord = z.infer<typeof FinancialRecordSchema>;
export type KPI = z.infer<typeof KPISchema>;
export type Anomaly = z.infer<typeof AnomalySchema>;
export type FinancialSummary = z.infer<typeof FinancialSummarySchema>;
export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;
export type QueryResponse = z.infer<typeof QueryResponseSchema>;
//# sourceMappingURL=schemas.d.ts.map