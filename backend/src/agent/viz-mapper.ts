export interface WidgetConfig {
  widget_id: string;
  type: "kpi" | "chart" | "table";
  visualization_type: "kpi" | "bar" | "line" | "pie" | "table";
  title: string;
  data: any[];
  config: {
    xAxis?: string;
    yAxis?: string;
    colorScheme?: string;
    aggregation?: "sum" | "avg" | "count";
    sortBy?: string;
    limit?: number;
  };
}

export function autoDetectVisualizationType(
  data: any[],
  suggestedType: "kpi" | "bar" | "line" | "pie" | "table",
  description: string
): WidgetConfig["visualization_type"] {
  // If suggestion provided, use it
  if (suggestedType && suggestedType !== "chart") {
    return suggestedType;
  }

  if (!data || data.length === 0) {
    return "table";
  }

  const firstRow = data[0];
  const keys = Object.keys(firstRow);
  const rowCount = data.length;

  // Single KPI value
  if (rowCount === 1 && keys.length === 1) {
    return "kpi";
  }

  // Multiple rows → check for time series
  if (hasDateColumn(data, keys)) {
    return "line"; // Time series are best shown as lines
  }

  // Check if data looks like proportions (sum ≈ 100)
  if (isProportionalData(data)) {
    return "pie";
  }

  // Many rows → table
  if (rowCount > 10) {
    return "table";
  }

  // Categories vs values → bar chart (default for most cases)
  return "bar";
}

function hasDateColumn(data: any[], keys: string[]): boolean {
  for (const key of keys) {
    if (
      key.toLowerCase().includes("date") ||
      key.toLowerCase().includes("time") ||
      key.toLowerCase().includes("month") ||
      key.toLowerCase().includes("year")
    ) {
      const val = data[0][key];
      // Check if it looks like a date
      if (
        val instanceof Date ||
        typeof val === "string" &&
        (val.match(/\d{4}-\d{2}-\d{2}/) || val.match(/\d{1,2}\/\d{1,2}\/\d{4}/))
      ) {
        return true;
      }
    }
  }
  return false;
}

function isProportionalData(data: any[]): boolean {
  if (data.length < 2) return false;

  // Find numeric column
  const firstRow = data[0];
  let valueKey = "";

  for (const key of Object.keys(firstRow)) {
    if (typeof firstRow[key] === "number" && !key.includes("id")) {
      valueKey = key;
      break;
    }
  }

  if (!valueKey) return false;

  // Check if sum is close to 100 or total is meaningful
  const sum = data.reduce((acc, row) => acc + (row[valueKey] || 0), 0);

  // If values are small percentages or add up to ~100, treat as pie
  return sum <= 100 || (sum > 0 && data.every((row) => row[valueKey] <= 100));
}

export function transformDataForVisualization(data: any[], vizType: string): any[] {
  if (!data || data.length === 0) {
    return [];
  }

  switch (vizType) {
    case "kpi":
      // For KPI, extract just the value
      return data.slice(0, 1);

    case "pie":
      // Pie needs name/label and value
      return data.map((row, idx) => {
        const keys = Object.keys(row);
        const nameKey = keys.find(
          (k) =>
            k.toLowerCase().includes("name") ||
            k.toLowerCase().includes("category") ||
            k.toLowerCase().includes("sector") ||
            k.toLowerCase().includes("ticker")
        ) || keys[0];

        const valueKey = keys.find(
          (k) =>
            typeof row[k] === "number" &&
            !k.toLowerCase().includes("id") &&
            !k.toLowerCase().includes("count")
        ) || keys[1];

        return {
          name: row[nameKey],
          value: row[valueKey],
        };
      });

    case "bar":
      // Bar chart needs categories and values
      return data.slice(0, 20); // Limit to 20 for readability

    case "line":
      // Line chart needs date/time and value(s)
      return data.map((row) => {
        const keys = Object.keys(row);
        const dateKey = keys.find(
          (k) =>
            k.toLowerCase().includes("date") ||
            k.toLowerCase().includes("month") ||
            k.toLowerCase().includes("time")
        );

        if (dateKey) {
          // Keep date key, transform date format if needed
          return {
            ...row,
            [dateKey]: formatDate(row[dateKey]),
          };
        }
        return row;
      });

    case "table":
    default:
      // For tables, limit to 100 rows
      return data.slice(0, 100);
  }
}

function formatDate(dateVal: any): string {
  if (dateVal instanceof Date) {
    return dateVal.toISOString().split("T")[0];
  }
  if (typeof dateVal === "string") {
    return dateVal;
  }
  return String(dateVal);
}

export function createWidgetConfig(
  widgetId: string,
  title: string,
  data: any[],
  suggestedVizType: "kpi" | "bar" | "line" | "pie" | "table",
  description: string
): WidgetConfig {
  // Auto-detect best visualization
  const vizType = autoDetectVisualizationType(data, suggestedVizType, description);

  // Transform data for this visualization
  const transformedData = transformDataForVisualization(data, vizType);

  // Determine widget type
  const widgetType = vizType === "kpi" ? "kpi" : vizType === "table" ? "table" : "chart";

  // Create config object
  const config: WidgetConfig["config"] = {
    colorScheme: "default",
  };

  // Add specific config based on viz type
  if (vizType === "bar" || vizType === "line") {
    const keys = Object.keys(data[0] || {});
    const xKey = keys.find(
      (k) =>
        !k.toLowerCase().includes("value") &&
        !k.toLowerCase().includes("total") &&
        !k.toLowerCase().includes("amount")
    ) || keys[0];

    const yKey = keys.find(
      (k) =>
        typeof data[0]?.[k] === "number" &&
        (k.toLowerCase().includes("value") ||
          k.toLowerCase().includes("total") ||
          k.toLowerCase().includes("amount"))
    ) || keys[1];

    config.xAxis = xKey;
    config.yAxis = yKey;
  }

  return {
    widget_id: widgetId,
    type: widgetType,
    visualization_type: vizType,
    title,
    data: transformedData,
    config,
  };
}
