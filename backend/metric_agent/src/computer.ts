import {
  FinancialMetric,
  MetricCalculationRequest,
  MetricCalculationResult,
} from "./types.js";

export class MetricComputer {
  computeMetrics(request: MetricCalculationRequest): MetricCalculationResult {
    console.log("\n📊 Computing metrics...");
    
    const metrics: FinancialMetric[] = [];
    const insights: string[] = [];
    
    if (!request.data || request.data.length === 0) {
      return {
        metrics: [],
        summary: "No data to compute",
        insights: ["Empty dataset"],
      };
    }
    
    const numericKeys = Object.keys(request.data[0]).filter(
      (k) => typeof request.data[0][k] === "number"
    );
    
    for (const metricName of request.metricsToCalculate) {
      const metric = this.calculateMetric(metricName, request.data, numericKeys);
      if (metric) metrics.push(metric);
    }
    
    insights.push(`Analyzed ${request.data.length} records`);
    
    const summary = `Calculated ${metrics.length} metrics`;
    console.log(`   ✓ ${summary}`);
    
    return { metrics, summary, insights };
  }

  private calculateMetric(
    metricName: string,
    data: any[],
    numericKeys: string[]
  ): FinancialMetric | null {
    const key = numericKeys[0] || "value";
    const values = data.map((d) => Number(d[key]) || 0);
    
    switch (metricName.toLowerCase()) {
      case "total":
      case "sum":
        return {
          name: "Total",
          value: values.reduce((a, b) => a + b, 0),
          unit: this.detectUnit(key),
          category: "other",
        };
      
      case "average":
      case "avg":
        return {
          name: "Average",
          value: values.reduce((a, b) => a + b, 0) / values.length,
          unit: this.detectUnit(key),
          category: "efficiency",
        };
      
      case "count":
        return {
          name: "Count",
          value: data.length,
          unit: "items",
          category: "other",
        };
      
      case "max":
        return {
          name: "Maximum",
          value: Math.max(...values),
          unit: this.detectUnit(key),
          category: "other",
        };
      
      case "min":
        return {
          name: "Minimum",
          value: Math.min(...values),
          unit: this.detectUnit(key),
          category: "other",
        };
      
      case "growth":
        return {
          name: "Growth Rate",
          value: 0,
          unit: "%",
          category: "growth",
          trend: { direction: "stable" },
        };
      
      default:
        return null;
    }
  }

  private detectUnit(key: string): string {
    if (key.includes("percent")) return "%";
    if (key.includes("price") || key.includes("amount")) return "$";
    return "";
  }
}
