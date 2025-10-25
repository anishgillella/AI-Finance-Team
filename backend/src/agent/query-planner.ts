import { DashboardIntent } from "./intent-parser.js";

export interface QuerySpec {
  query_id: string;
  nl_query: string;
  purpose: "kpi" | "chart_data" | "table_data";
  visualization_type: "kpi" | "bar" | "line" | "pie" | "table";
  description: string;
  expected_columns?: string[];
  fallback_mock_data?: any[];
}

export interface QueryPlan {
  dashboard_id: string;
  dashboard_type: string;
  queries: QuerySpec[];
  estimated_execution_time_ms: number;
}

// Intent type to natural language query mappings
const queryTemplates: Record<string, Record<string, string>> = {
  PORTFOLIO: {
    top_holdings:
      "Show me the top {limit} holdings with their ticker, quantity, average cost, current price, market value, and gains",
    allocation:
      "What is my asset allocation by sector? Show sector and total value for each sector",
    performance:
      "Show me portfolio performance with ticker, gains, and percentage gain for each holding",
    total_value: "What is my total portfolio value and total gains?",
    trends:
      "Show portfolio value trends over the last {time_range} with date and portfolio value for each day",
  },
  TRANSACTIONS: {
    by_category:
      "How much did I spend in each category? Show category, total spent, and transaction count",
    by_date: "Show my transaction history with date, amount, category, and merchant",
    by_merchant:
      "What are my top merchants by spending? Show merchant, total spent, and transaction count",
    recent:
      "Show me my recent transactions with date, amount, category, merchant, and description",
    summary: "Give me my total spending, average transaction, and transaction count",
  },
  BUDGETS: {
    status: "Show my budget status by category with limit, spent, and remaining amount",
    health: "What percentage of my total budget have I used? Show category breakdown",
    vs_limit: "Show budget vs actual for each category with percentage used",
    alerts: "Which budget categories am I approaching or over the limit on?",
  },
  FINANCIAL_GOALS: {
    progress: "Show my financial goals with goal name, target amount, current amount, and progress percentage",
    status:
      "What are my financial goals and their status? Show goal name, status, and progress",
    timeline:
      "Show my financial goals with target dates and how many days until target",
    summary: "How many goals do I have and what percentage are on track?",
  },
};

// Mock fallback data for testing
const mockDataFallbacks: Record<string, Record<string, any[]>> = {
  PORTFOLIO: {
    top_holdings: [
      {
        ticker: "AAPL",
        quantity: 100,
        average_cost: 150,
        current_price: 180,
        market_value: 18000,
        gains: 3000,
      },
      {
        ticker: "MSFT",
        quantity: 50,
        average_cost: 300,
        current_price: 350,
        market_value: 17500,
        gains: 2500,
      },
      {
        ticker: "GOOGL",
        quantity: 75,
        average_cost: 140,
        current_price: 160,
        market_value: 12000,
        gains: 1500,
      },
    ],
    allocation: [
      { sector: "Technology", value: 35000 },
      { sector: "Healthcare", value: 15000 },
      { sector: "Finance", value: 12000 },
    ],
  },
  TRANSACTIONS: {
    by_category: [
      { category: "Groceries", total_spent: 1200, transaction_count: 45 },
      { category: "Transport", total_spent: 800, transaction_count: 32 },
      { category: "Entertainment", total_spent: 400, transaction_count: 15 },
    ],
    summary: [
      { metric: "total_spending", value: 2400 },
      { metric: "average_transaction", value: 75 },
      { metric: "transaction_count", value: 92 },
    ],
  },
  BUDGETS: {
    status: [
      { category: "Housing", limit: 2000, spent: 1800, remaining: 200 },
      { category: "Food", limit: 800, spent: 650, remaining: 150 },
      { category: "Transport", limit: 500, spent: 480, remaining: 20 },
    ],
  },
  FINANCIAL_GOALS: {
    progress: [
      {
        goal_name: "Emergency Fund",
        target_amount: 10000,
        current_amount: 6500,
        progress_percentage: 65,
      },
      {
        goal_name: "Vacation",
        target_amount: 5000,
        current_amount: 2300,
        progress_percentage: 46,
      },
      {
        goal_name: "Retirement",
        target_amount: 500000,
        current_amount: 125000,
        progress_percentage: 25,
      },
    ],
  },
};

export async function planQueries(intent: DashboardIntent): Promise<QueryPlan> {
  console.log(`\n📋 Planning queries for ${intent.dashboard_type} dashboard`);

  const queries: QuerySpec[] = [];
  const dashboardType = intent.dashboard_type;

  // Generate queries based on widget hints
  for (let i = 0; i < intent.widget_hints.length; i++) {
    const hint = intent.widget_hints[i];
    const queryId = `query_${i + 1}`;

    // Determine the query from templates
    let nlQuery = "";

    if (dashboardType === "PORTFOLIO") {
      if (hint.suggested_metrics.includes("ticker") && hint.suggested_metrics.includes("market_value")) {
        nlQuery = queryTemplates.PORTFOLIO.top_holdings?.replace("{limit}", "5") || "";
      } else if (hint.suggested_metrics.includes("sector")) {
        nlQuery = queryTemplates.PORTFOLIO.allocation || "";
      } else if (hint.suggested_metrics.includes("gains")) {
        nlQuery = queryTemplates.PORTFOLIO.performance || "";
      } else if (hint.suggested_metrics.includes("portfolio_value")) {
        nlQuery = queryTemplates.PORTFOLIO.trends?.replace("{time_range}", intent.time_range || "30_days") || "";
      } else {
        nlQuery = queryTemplates.PORTFOLIO.total_value || "";
      }
    } else if (dashboardType === "TRANSACTIONS") {
      if (hint.suggested_metrics.includes("category")) {
        nlQuery = queryTemplates.TRANSACTIONS.by_category || "";
      } else if (hint.suggested_metrics.includes("date")) {
        nlQuery = queryTemplates.TRANSACTIONS.by_date || "";
      } else if (hint.suggested_metrics.includes("merchant")) {
        nlQuery = queryTemplates.TRANSACTIONS.by_merchant || "";
      } else {
        nlQuery = queryTemplates.TRANSACTIONS.summary || "";
      }
    } else if (dashboardType === "BUDGETS") {
      if (hint.suggested_metrics.includes("spent")) {
        nlQuery = queryTemplates.BUDGETS.vs_limit || "";
      } else {
        nlQuery = queryTemplates.BUDGETS.status || "";
      }
    } else if (dashboardType === "FINANCIAL_GOALS") {
      nlQuery = queryTemplates.FINANCIAL_GOALS.progress || "";
    }

    // Create query spec
    const querySpec: QuerySpec = {
      query_id: queryId,
      nl_query: nlQuery,
      purpose: hint.suggested_viz_type === "kpi" ? "kpi" : hint.suggested_viz_type === "table" ? "table_data" : "chart_data",
      visualization_type: hint.suggested_viz_type,
      description: hint.purpose,
      expected_columns: hint.suggested_metrics,
      fallback_mock_data: getMockData(dashboardType, hint.suggested_metrics),
    };

    queries.push(querySpec);
  }

  const plan: QueryPlan = {
    dashboard_id: `dashboard_${Date.now()}`,
    dashboard_type: dashboardType,
    queries,
    estimated_execution_time_ms: queries.length * 800, // ~800ms per query
  };

  console.log(`✓ Plan created with ${queries.length} queries`);
  console.log(`  Queries:${queries.map((q) => `\n    - ${q.description} (${q.visualization_type})`).join("")}`);

  return plan;
}

function getMockData(dashboardType: string, metrics: string[]): any[] {
  // Return appropriate mock data for fallback
  const typeData = mockDataFallbacks[dashboardType as keyof typeof mockDataFallbacks];
  if (!typeData) return [];

  // Match based on metrics
  if (metrics.includes("ticker") && metrics.includes("market_value")) {
    return typeData.top_holdings || [];
  } else if (metrics.includes("sector")) {
    return typeData.allocation || [];
  } else if (metrics.includes("category")) {
    return typeData.by_category || [];
  } else if (metrics.includes("goal_name")) {
    return typeData.progress || [];
  }

  return [];
}
