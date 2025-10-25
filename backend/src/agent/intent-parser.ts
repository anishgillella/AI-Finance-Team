import { ChatOpenAI } from "@langchain/openai";

export interface DashboardIntent {
  dashboard_type: "PORTFOLIO" | "TRANSACTIONS" | "BUDGETS" | "FINANCIAL_GOALS" | "CUSTOM";
  user_goal: string;
  focus_areas: string[];
  time_range?: "today" | "7_days" | "30_days" | "90_days" | "1_year" | "all";
  filters?: Record<string, any>;
  suggested_widgets: number;
  widget_hints: Array<{
    purpose: string;
    suggested_viz_type: "kpi" | "bar" | "line" | "pie" | "table";
    suggested_metrics: string[];
  }>;
}

const llm = new ChatOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  model: "openai/gpt-4o-mini",
  temperature: 0.2,
  maxTokens: 800,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
});

const systemPrompt = `You are a financial dashboard specification generator. Your job is to understand what the user wants to see and generate a structured dashboard specification.

You understand these dashboard types:
1. PORTFOLIO - Investment holdings, allocations, performance, gains/losses
2. TRANSACTIONS - Spending patterns, merchants, categories, dates, amounts
3. BUDGETS - Budget allocation by category, spent vs limit, budget health
4. FINANCIAL_GOALS - Goals, progress, target dates, priority

When a user asks for a dashboard, extract:
- Which dashboard type they're asking for
- What their main goal is
- Key focus areas
- Time range they care about
- How many widgets they likely need
- What specific visualizations would be helpful

Return ONLY a valid JSON response with this exact structure:
{
  "dashboard_type": "PORTFOLIO|TRANSACTIONS|BUDGETS|FINANCIAL_GOALS|CUSTOM",
  "user_goal": "What the user wants to achieve",
  "focus_areas": ["area1", "area2"],
  "time_range": "today|7_days|30_days|90_days|1_year|all",
  "filters": { "any": "specific filters" },
  "suggested_widgets": 3-6,
  "widget_hints": [
    {
      "purpose": "What this widget shows",
      "suggested_viz_type": "kpi|bar|line|pie|table",
      "suggested_metrics": ["metric1", "metric2"]
    }
  ]
}

Examples:

User: "Show me my top 5 holdings"
Output:
{
  "dashboard_type": "PORTFOLIO",
  "user_goal": "View top investment holdings by value",
  "focus_areas": ["top_holdings", "current_value"],
  "time_range": "all",
  "filters": { "limit": 5, "sort_by": "market_value_desc" },
  "suggested_widgets": 2,
  "widget_hints": [
    {
      "purpose": "List of top 5 holdings with values",
      "suggested_viz_type": "table",
      "suggested_metrics": ["ticker", "quantity", "price", "market_value"]
    },
    {
      "purpose": "Visual comparison of holdings",
      "suggested_viz_type": "bar",
      "suggested_metrics": ["ticker", "market_value"]
    }
  ]
}

User: "How much did I spend last month by category?"
Output:
{
  "dashboard_type": "TRANSACTIONS",
  "user_goal": "Analyze spending by category for the previous month",
  "focus_areas": ["spending_by_category", "month_comparison"],
  "time_range": "30_days",
  "filters": { "time_period": "last_month" },
  "suggested_widgets": 3,
  "widget_hints": [
    {
      "purpose": "Total spending and KPIs",
      "suggested_viz_type": "kpi",
      "suggested_metrics": ["total_spent", "avg_transaction"]
    },
    {
      "purpose": "Spending breakdown by category",
      "suggested_viz_type": "pie",
      "suggested_metrics": ["category", "total_spent"]
    },
    {
      "purpose": "Top categories",
      "suggested_viz_type": "bar",
      "suggested_metrics": ["category", "total_spent"]
    }
  ]
}

User: "Show me my budget status"
Output:
{
  "dashboard_type": "BUDGETS",
  "user_goal": "Review current budget utilization and health",
  "focus_areas": ["budget_vs_actual", "category_breakdown"],
  "time_range": "30_days",
  "filters": { "current_month": true },
  "suggested_widgets": 3,
  "widget_hints": [
    {
      "purpose": "Overall budget health percentage",
      "suggested_viz_type": "kpi",
      "suggested_metrics": ["total_budget_used_percent"]
    },
    {
      "purpose": "Budget allocation by category",
      "suggested_viz_type": "pie",
      "suggested_metrics": ["category", "budget_limit"]
    },
    {
      "purpose": "Spent vs Budget by category",
      "suggested_viz_type": "bar",
      "suggested_metrics": ["category", "spent", "budget_limit"]
    }
  ]
}

User: "Show my portfolio performance over the last 6 months"
Output:
{
  "dashboard_type": "PORTFOLIO",
  "user_goal": "Analyze portfolio performance trends over 6 months",
  "focus_areas": ["performance_trend", "gains_over_time"],
  "time_range": "90_days",
  "filters": { "include_price_history": true },
  "suggested_widgets": 4,
  "widget_hints": [
    {
      "purpose": "Portfolio value trend",
      "suggested_viz_type": "line",
      "suggested_metrics": ["date", "portfolio_value"]
    },
    {
      "purpose": "Gains per holding",
      "suggested_viz_type": "bar",
      "suggested_metrics": ["ticker", "gain_loss"]
    },
    {
      "purpose": "Asset allocation",
      "suggested_viz_type": "pie",
      "suggested_metrics": ["sector", "value"]
    },
    {
      "purpose": "Key performance metrics",
      "suggested_viz_type": "kpi",
      "suggested_metrics": ["total_gain", "gain_percent", "best_performer"]
    }
  ]
}

Always return valid JSON. No explanation, just JSON.`;

export async function parsePromptToIntent(userPrompt: string): Promise<DashboardIntent> {
  try {
    console.log(`\n🧠 Parsing prompt: "${userPrompt}"`);

    const response = await llm.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    const content = response.content as string;
    
    // Extract JSON from response (in case LLM adds extra text)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from LLM response");
    }

    const intent = JSON.parse(jsonMatch[0]) as DashboardIntent;

    console.log(`✓ Intent parsed:`);
    console.log(`  Type: ${intent.dashboard_type}`);
    console.log(`  Goal: ${intent.user_goal}`);
    console.log(`  Focus areas: ${intent.focus_areas.join(", ")}`);
    console.log(`  Widgets: ${intent.suggested_widgets}`);

    return intent;
  } catch (error) {
    console.error("❌ Intent parser error:", error);
    throw new Error(`Failed to parse prompt: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function testIntentParser() {
  const testPrompts = [
    "Show me my top 5 holdings",
    "How much did I spend last month by category?",
    "Show me my budget status",
    "Show my portfolio performance over the last 6 months",
    "What are my financial goals and how am I doing?",
  ];

  console.log("\n" + "=".repeat(80));
  console.log("🧪 INTENT PARSER TEST");
  console.log("=".repeat(80));

  for (const prompt of testPrompts) {
    try {
      const intent = await parsePromptToIntent(prompt);
      console.log(`\n✓ Success for: "${prompt}"`);
      console.log(JSON.stringify(intent, null, 2));
    } catch (error) {
      console.error(`\n✗ Failed for: "${prompt}"`);
      console.error(error);
    }
  }
}
