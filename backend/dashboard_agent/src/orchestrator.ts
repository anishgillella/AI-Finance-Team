/**
 * Dashboard Orchestrator - Breaks down dashboard requests into queries
 */

import {
  DashboardType,
  DashboardRequest,
  DashboardResponse,
  DashboardTemplate,
  QueryRequirement,
  QueryResult,
  DashboardWidget,
} from "./types.js";

export class DashboardOrchestrator {
  private templates: Map<DashboardType, DashboardTemplate> = new Map([
    [
      DashboardType.PORTFOLIO,
      {
        type: DashboardType.PORTFOLIO,
        title: "Portfolio Dashboard",
        description: "View your investment portfolio performance and allocation",
        queries: [
          {
            id: "portfolio-value",
            description: "Total portfolio value",
            query: "What is my total portfolio value by sector?",
            purpose: "kpi",
          },
          {
            id: "allocation",
            description: "Asset allocation",
            query: "Show me my portfolio allocation by sector with percentages",
            purpose: "chart_data",
            chartType: "pie",
          },
          {
            id: "top-holdings",
            description: "Top holdings",
            query: "Show top 5 holdings by market value",
            purpose: "table_data",
            chartType: "table",
          },
          {
            id: "performance",
            description: "YoY performance",
            query: "Calculate portfolio gain/loss by holding",
            purpose: "chart_data",
            chartType: "bar",
          },
        ],
      },
    ],
    [
      DashboardType.TRANSACTIONS,
      {
        type: DashboardType.TRANSACTIONS,
        title: "Transactions Dashboard",
        description: "Analyze your transaction history",
        queries: [
          {
            id: "total-spending",
            description: "Total spending",
            query: "What is my total spending this month?",
            purpose: "kpi",
          },
          {
            id: "spending-by-category",
            description: "Spending by category",
            query: "Show spending by transaction category",
            purpose: "chart_data",
            chartType: "bar",
          },
          {
            id: "recent-transactions",
            description: "Recent transactions",
            query: "Show 10 recent transactions",
            purpose: "table_data",
            chartType: "table",
          },
          {
            id: "monthly-trend",
            description: "Monthly trend",
            query: "Show monthly spending trend",
            purpose: "chart_data",
            chartType: "line",
          },
        ],
      },
    ],
    [
      DashboardType.BUDGETS,
      {
        type: DashboardType.BUDGETS,
        title: "Budget Dashboard",
        description: "Track budgets and spending",
        queries: [
          {
            id: "budget-summary",
            description: "Budget summary",
            query: "What is my total budget and spent?",
            purpose: "kpi",
          },
          {
            id: "budget-status",
            description: "Budget status",
            query: "Show budget by category",
            purpose: "chart_data",
            chartType: "bar",
          },
          {
            id: "budgets-detailed",
            description: "Budget details",
            query: "Show all budget details",
            purpose: "table_data",
            chartType: "table",
          },
          {
            id: "overspent",
            description: "Over budget",
            query: "Show overspent categories",
            purpose: "chart_data",
            chartType: "bar",
          },
        ],
      },
    ],
    [
      DashboardType.FINANCIAL_GOALS,
      {
        type: DashboardType.FINANCIAL_GOALS,
        title: "Financial Goals Dashboard",
        description: "Monitor financial goals",
        queries: [
          {
            id: "goals-summary",
            description: "Goals summary",
            query: "Financial goals summary stats",
            purpose: "kpi",
          },
          {
            id: "goals-progress",
            description: "Goal progress",
            query: "Show goal progress percentages",
            purpose: "chart_data",
            chartType: "bar",
          },
          {
            id: "goals-detailed",
            description: "Goal details",
            query: "Show all financial goals",
            purpose: "table_data",
            chartType: "table",
          },
          {
            id: "goals-timeline",
            description: "Goals timeline",
            query: "Show goals by target date",
            purpose: "chart_data",
            chartType: "timeline",
          },
        ],
      },
    ],
  ]);

  private generateId(): string {
    return `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  parseDashboardRequest(request: DashboardRequest): QueryRequirement[] {
    console.log(`\n📊 Parsing ${request.type} dashboard request...`);
    const template = this.templates.get(request.type);
    if (!template) throw new Error(`Unknown dashboard type: ${request.type}`);
    
    let queries = template.queries;
    if (request.filters?.excludeQueries) {
      const exclude = new Set(request.filters.excludeQueries);
      queries = queries.filter((q) => !exclude.has(q.id));
    }
    
    console.log(`   ✓ Found ${queries.length} queries`);
    return queries;
  }

  prepareQueries(queries: QueryRequirement[]): string[] {
    return queries.filter((q) => q.query).map((q) => q.query as string);
  }

  async buildDashboardResponse(
    request: DashboardRequest,
    queryResults: QueryResult[],
    executionTime: number
  ): Promise<DashboardResponse> {
    const template = this.templates.get(request.type)!;
    const dashboardId = this.generateId();

    console.log(`\n🏗️  Building dashboard response...`);

    const errors = queryResults
      .filter((r) => r.error)
      .map((r) => `Query ${r.queryId} failed: ${r.error}`);

    const widgets: DashboardWidget[] = queryResults
      .filter((result) => !result.error)
      .map((result, index) => {
        const query = template.queries.find((q) => q.id === result.queryId)!;
        return {
          id: `widget_${index + 1}`,
          type: query.purpose === "table_data" ? "table" : query.purpose === "kpi" ? "kpi" : "chart",
          title: query.description,
          data: result.data,
          config: { chartType: query.chartType, queryId: result.queryId },
        };
      });

    const response: DashboardResponse = {
      id: dashboardId,
      type: request.type,
      title: template.title,
      description: template.description,
      widgets,
      metadata: {
        generatedAt: new Date().toISOString(),
        dataFreshness: "real-time",
        totalQueries: queryResults.length,
        executionTime,
      },
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log(`   ✓ Dashboard with ${widgets.length} widgets`);
    return response;
  }

  getAvailableDashboards() {
    const dashboards: any[] = [];
    this.templates.forEach((template) => {
      dashboards.push({
        type: template.type,
        title: template.title,
        description: template.description,
        queryCount: template.queries.length,
      });
    });
    return dashboards;
  }
}
