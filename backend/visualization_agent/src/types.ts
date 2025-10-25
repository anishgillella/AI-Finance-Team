export type ChartType = "line" | "bar" | "pie" | "area" | "scatter" | "table" | "kpi" | "timeline";

export interface ChartConfig {
  type: ChartType;
  title: string;
  data: any[];
  xAxis?: { key: string; label: string };
  yAxis?: { key: string; label: string };
  responsive: boolean;
  height?: number;
}

export interface KPIConfig {
  type: "kpi";
  title: string;
  value: string | number;
  unit?: string;
  color?: "green" | "red" | "neutral";
}

export interface TableConfig {
  type: "table";
  title: string;
  columns: Array<{ key: string; label: string; type: string }>;
  data: any[];
}

export type VisualizationConfig = ChartConfig | KPIConfig | TableConfig;

export interface VisualizationRequest {
  data: any[];
  suggestedType?: ChartType;
  title?: string;
}

export interface VisualizationResult {
  config: VisualizationConfig;
  confidence: number;
}
