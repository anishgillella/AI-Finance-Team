import {
  ChartType,
  ChartConfig,
  KPIConfig,
  TableConfig,
  VisualizationRequest,
  VisualizationResult,
  VisualizationConfig,
} from "./types.js";

export class VisualizationMapper {
  private detectChartType(data: any[]): ChartType {
    if (!data || data.length === 0) return "table";
    
    const sample = data[0];
    const keys = Object.keys(sample);
    
    const hasDate = keys.some((k) => this.isDateColumn(k, data));
    const numericColumns = keys.filter((k) => this.isNumericColumn(k, data));
    const categoryColumns = keys.filter((k) => this.isCategoryColumn(k, data));
    
    if (hasDate && numericColumns.length >= 1) return "line";
    if (categoryColumns.length >= 1 && numericColumns.length >= 1 && data.length <= 10) return "pie";
    if (categoryColumns.length >= 1 && numericColumns.length >= 1) return "bar";
    return "table";
  }

  private isDateColumn(key: string, data: any[]): boolean {
    const dateKeywords = ["date", "time", "month", "year"];
    if (!dateKeywords.some((kw) => key.toLowerCase().includes(kw))) return false;
    const sample = data.find((d) => d[key]);
    return sample ? !isNaN(Date.parse(String(sample[key]))) : false;
  }

  private isNumericColumn(key: string, data: any[]): boolean {
    const sample = data.find((d) => d[key] !== null);
    return sample ? typeof sample[key] === "number" || !isNaN(Number(sample[key])) : false;
  }

  private isCategoryColumn(key: string, data: any[]): boolean {
    const keywords = ["name", "type", "category", "status"];
    return keywords.some((kw) => key.toLowerCase().includes(kw));
  }

  mapToChart(data: any[], chartType: ChartType, title: string = "Chart"): ChartConfig {
    const keys = data.length > 0 ? Object.keys(data[0]) : [];
    const numericKey = keys.find((k) => this.isNumericColumn(k, data)) || keys[0];
    const categoryKey = keys.find((k) => this.isCategoryColumn(k, data)) || keys[0];
    
    return {
      type: chartType,
      title,
      data,
      xAxis: { key: categoryKey, label: this.prettifyLabel(categoryKey) },
      yAxis: { key: numericKey, label: this.prettifyLabel(numericKey) },
      responsive: true,
      height: 400,
    };
  }

  mapToKPI(data: any[], title: string = "KPI"): KPIConfig {
    if (!data || data.length === 0) {
      return { type: "kpi", title, value: 0 };
    }
    
    const row = data[0];
    const numericKey = Object.keys(row).find((k) => typeof row[k] === "number") || Object.keys(row)[0];
    const value = row[numericKey];
    
    return {
      type: "kpi",
      title,
      value,
      unit: this.detectUnit(numericKey),
      color: typeof value === "number" && value > 0 ? "green" : "neutral",
    };
  }

  mapToTable(data: any[], title: string = "Table"): TableConfig {
    if (!data || data.length === 0) {
      return { type: "table", title, columns: [], data: [] };
    }
    
    const keys = Object.keys(data[0]);
    return {
      type: "table",
      title,
      columns: keys.map((key) => ({
        key,
        label: this.prettifyLabel(key),
        type: "string",
      })),
      data,
    };
  }

  mapVisualization(request: VisualizationRequest): VisualizationResult {
    console.log("\n🎨 Mapping visualization...");
    
    const chartType = request.suggestedType || this.detectChartType(request.data);
    let config: VisualizationConfig;
    
    if (chartType === "kpi") {
      config = this.mapToKPI(request.data, request.title);
    } else if (chartType === "table") {
      config = this.mapToTable(request.data, request.title);
    } else {
      config = this.mapToChart(request.data, chartType, request.title);
    }
    
    console.log(`   ✓ Mapped to ${chartType}`);
    return { config, confidence: 0.85 };
  }

  private detectUnit(key: string): string {
    if (key.includes("percent")) return "%";
    if (key.includes("price") || key.includes("amount")) return "$";
    return "";
  }

  private prettifyLabel(key: string): string {
    return key
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .trim()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
}
