/**
 * Complete Dashboard Demo - Pure JavaScript
 * Shows all agents working together with sample data
 */

console.log("\n╔════════════════════════════════════════════════════════════════╗");
console.log("║          🎯 DASHBOARD ORCHESTRATION DEMO                       ║");
console.log("╚════════════════════════════════════════════════════════════════╝\n");

const startTime = Date.now();

// ===== MOCK AGENT CLASSES (Simulating what we built) =====

class DashboardOrchestrator {
  getAvailableDashboards() {
    return [
      { type: "PORTFOLIO", title: "Portfolio Dashboard", description: "Portfolio tracking", queryCount: 4 },
      { type: "TRANSACTIONS", title: "Transactions Dashboard", description: "Transaction history", queryCount: 4 },
      { type: "BUDGETS", title: "Budget Dashboard", description: "Budget tracking", queryCount: 4 },
      { type: "FINANCIAL_GOALS", title: "Financial Goals Dashboard", description: "Goal monitoring", queryCount: 4 },
    ];
  }

  buildDashboardResponse(request, queryResults, executionTime) {
    return {
      id: `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: request.type,
      title: "Portfolio Dashboard",
      description: "View your investment portfolio performance and allocation",
      widgets: [],
      metadata: {
        generatedAt: new Date().toISOString(),
        dataFreshness: "real-time",
        totalQueries: queryResults.length,
        executionTime,
      },
    };
  }
}

class VisualizationMapper {
  mapVisualization(request) {
    const chartTypes = ["pie", "bar", "line", "kpi", "table"];
    const type = request.suggestedType || chartTypes[Math.floor(Math.random() * chartTypes.length)];

    return {
      config: {
        type: type,
        title: request.title,
        data: request.data,
      },
      confidence: 0.85,
    };
  }
}

class MetricComputer {
  computeMetrics(request) {
    if (!request.data || request.data.length === 0) {
      return { metrics: [], summary: "No data", insights: [] };
    }

    const numericKey = Object.keys(request.data[0]).find((k) => typeof request.data[0][k] === "number");
    const values = request.data.map((d) => Number(d[numericKey]) || 0);
    const total = values.reduce((a, b) => a + b, 0);
    const avg = total / values.length;

    return {
      metrics: [
        { name: "Total", value: total, unit: "$", category: "profitability" },
        { name: "Average", value: Math.round(avg), unit: "$", category: "efficiency" },
        { name: "Count", value: request.data.length, unit: "items", category: "other" },
        { name: "Maximum", value: Math.max(...values), unit: "$", category: "other" },
      ],
      summary: `Calculated 4 metrics from ${request.data.length} data points`,
      insights: [
        `Analyzed ${request.data.length} records`,
        "Portfolio showing strong performance",
      ],
    };
  }
}

// ===== STEP 1: List Available Dashboards =====
console.log("📊 STEP 1: Available Dashboard Types");
console.log("────────────────────────────────────");

const orchestrator = new DashboardOrchestrator();
const dashboards = orchestrator.getAvailableDashboards();
dashboards.forEach((db) => {
  console.log(`  ✓ ${db.type}: ${db.title} (${db.queryCount} queries)`);
});

// ===== STEP 2: Parse Dashboard Request =====
console.log("\n📋 STEP 2: Parse Portfolio Dashboard Request");
console.log("───────────────────────────────────────────");

const queries = [
  {
    id: "portfolio-value",
    description: "Total portfolio value",
    query: "What is my total portfolio value?",
  },
  {
    id: "allocation",
    description: "Asset allocation",
    query: "Show me my portfolio allocation by sector",
  },
  {
    id: "top-holdings",
    description: "Top holdings",
    query: "Show top 5 holdings by market value",
  },
  {
    id: "performance",
    description: "YoY performance",
    query: "Calculate portfolio gain/loss",
  },
];

console.log(`  ✓ Identified ${queries.length} queries needed:\n`);
queries.forEach((q) => {
  console.log(`     • ${q.id}: ${q.description}`);
});

// ===== STEP 3: Simulate SQL Query Execution =====
console.log("\n🔄 STEP 3: Simulate SQL Query Execution (Parallel)");
console.log("──────────────────────────────────────────────────");

const mockQueryResults = [
  {
    queryId: "portfolio-value",
    data: [{ total_value: 320000 }],
    executionTime: 150,
  },
  {
    queryId: "allocation",
    data: [
      { sector: "Technology", value: 150000 },
      { sector: "Healthcare", value: 100000 },
      { sector: "Finance", value: 70000 },
    ],
    executionTime: 120,
  },
  {
    queryId: "top-holdings",
    data: [
      { ticker: "AAPL", shares: 100, price: 150, value: 15000 },
      { ticker: "MSFT", shares: 50, price: 300, value: 15000 },
      { ticker: "GOOGL", shares: 75, price: 140, value: 10500 },
      { ticker: "AMZN", shares: 30, price: 180, value: 5400 },
      { ticker: "NVDA", shares: 25, price: 900, value: 22500 },
    ],
    executionTime: 200,
  },
  {
    queryId: "performance",
    data: [
      { holding: "AAPL", gain_loss: 2000 },
      { holding: "MSFT", gain_loss: 3000 },
      { holding: "GOOGL", gain_loss: 1500 },
      { holding: "AMZN", gain_loss: 800 },
      { holding: "NVDA", gain_loss: 8200 },
    ],
    executionTime: 180,
  },
];

console.log("  Executing 4 queries in parallel:");
mockQueryResults.forEach((result) => {
  console.log(`     ✓ ${result.queryId} - ${result.executionTime}ms - ${result.data.length} rows`);
});
const queryTime = Math.max(...mockQueryResults.map((r) => r.executionTime));
console.log(`  ✓ Total query time (parallel): ${queryTime}ms\n`);

// ===== STEP 4: Visualization Agent =====
console.log("🎨 STEP 4: Visualization Mapping");
console.log("──────────────────────────────");

const visualizer = new VisualizationMapper();
const widgets = [];

mockQueryResults.forEach((result, idx) => {
  const viz = visualizer.mapVisualization({
    data: result.data,
    suggestedType: ["kpi", "pie", "table", "bar"][idx],
    title: queries[idx].description,
  });

  widgets.push({
    id: `widget_${idx + 1}`,
    ...viz.config,
    confidence: viz.confidence,
  });

  console.log(`  ✓ Widget ${idx + 1}: ${queries[idx].description} → ${viz.config.type}`);
});

console.log();

// ===== STEP 5: Metric Agent =====
console.log("📈 STEP 5: Metric Computation");
console.log("─────────────────────────────");

const metrics = new MetricComputer();
const metricsResult = metrics.computeMetrics({
  data: mockQueryResults[1].data,
  metricsToCalculate: ["total", "average", "count", "max"],
});

console.log(`  ✓ Computed ${metricsResult.metrics.length} metrics:\n`);
metricsResult.metrics.forEach((m) => {
  console.log(`     • ${m.name}: ${m.value.toLocaleString()} ${m.unit}`);
});

console.log();

// ===== STEP 6: Build Dashboard =====
console.log("🏗️  STEP 6: Building Complete Dashboard");
console.log("──────────────────────────────────────");

const totalTime = Date.now() - startTime;
const dashboard = orchestrator.buildDashboardResponse(
  { type: "PORTFOLIO" },
  mockQueryResults,
  totalTime
);

console.log(`  ✓ Dashboard ID: ${dashboard.id}`);
console.log(`  ✓ Type: ${dashboard.type}`);
console.log(`  ✓ Widgets: ${widgets.length}`);
console.log(`  ✓ Total execution time: ${totalTime}ms\n`);

// ===== FINAL RESPONSE =====
console.log("═══════════════════════════════════════════════════════════════");
console.log("📊 FINAL DASHBOARD JSON (Ready for Frontend)");
console.log("═══════════════════════════════════════════════════════════════\n");

const finalResponse = {
  success: true,
  data: {
    id: dashboard.id,
    type: dashboard.type,
    title: dashboard.title,
    description: dashboard.description,
    widgets: widgets.map((w) => ({
      id: w.id,
      type: w.type,
      title: w.title,
      data: w.data.slice(0, 3), // Show first 3 items
      config: {
        chartType: w.type,
        confidence: w.confidence,
      },
    })),
    metrics: metricsResult.metrics,
    insights: metricsResult.insights,
    summary: metricsResult.summary,
  },
  timing: {
    totalExecutionTime: totalTime,
    queriesExecuted: mockQueryResults.length,
    widgetsGenerated: widgets.length,
    metricsComputed: metricsResult.metrics.length,
  },
};

console.log(JSON.stringify(finalResponse, null, 2));

console.log("\n═══════════════════════════════════════════════════════════════");
console.log("✨ DASHBOARD ORCHESTRATION COMPLETE!");
console.log("═══════════════════════════════════════════════════════════════\n");

console.log("📊 EXECUTION SUMMARY:");
console.log("────────────────────");
console.log(`  ✓ [Dashboard Agent]    Parsed request → ${queries.length} queries`);
console.log(`  ✓ [SQL Agent]          Executed 4 queries in parallel (${queryTime}ms)`);
console.log(`  ✓ [Visualization]      Mapped to ${widgets.length} chart widgets`);
console.log(`  ✓ [Metric Agent]       Computed ${metricsResult.metrics.length} KPIs`);
console.log(`  ✓ [Total Time]         ${totalTime}ms\n`);

console.log("🎯 NEXT STEPS:");
console.log("  1. Send this JSON via Express API endpoint");
console.log("  2. Render in React frontend component");
console.log("  3. Display dashboard at http://localhost:3000/dashboard\n");
