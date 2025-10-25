/**
 * Dashboard Agent Types
 * Defines all dashboard-related data structures
 */

export enum DashboardType {
  PORTFOLIO = "PORTFOLIO",
  TRANSACTIONS = "TRANSACTIONS",
  BUDGETS = "BUDGETS",
  FINANCIAL_GOALS = "FINANCIAL_GOALS",
  CUSTOM = "CUSTOM",
}

export interface DashboardRequest {
  type: DashboardType;
  userId?: string;
  filters?: Record<string, any>;
  timeRange?: {
    start?: string;
    end?: string;
  };
}

export interface DashboardWidget {
  id: string;
  type: "kpi" | "chart" | "table";
  title: string;
  data: any;
  config?: Record<string, any>;
}

export interface DashboardResponse {
  id: string;
  type: DashboardType;
  title: string;
  description: string;
  widgets: DashboardWidget[];
  metadata: {
    generatedAt: string;
    dataFreshness: "real-time" | "cached";
    totalQueries: number;
    executionTime: number; // milliseconds
  };
  errors?: string[];
}

export interface QueryRequirement {
  id: string;
  description: string;
  query?: string; // Natural language query for SQL agent
  purpose: "kpi" | "chart_data" | "table_data";
  chartType?: string; // For visualization mapper
}

export interface DashboardTemplate {
  type: DashboardType;
  title: string;
  description: string;
  queries: QueryRequirement[];
}

export interface QueryResult {
  queryId: string;
  data: any[];
  error?: string;
  executionTime: number;
}
