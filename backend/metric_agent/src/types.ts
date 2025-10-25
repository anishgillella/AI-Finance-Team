export interface FinancialMetric {
  name: string;
  value: number;
  unit: string;
  category: "profitability" | "growth" | "efficiency" | "other";
  trend?: { direction: "up" | "down" | "stable"; percentage?: number };
}

export interface MetricCalculationRequest {
  data: any[];
  metricsToCalculate: string[];
  context?: { previousPeriod?: any[] };
}

export interface MetricCalculationResult {
  metrics: FinancialMetric[];
  summary: string;
  insights: string[];
}
