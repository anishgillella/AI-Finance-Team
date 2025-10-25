/**
 * Complete Dashboard Orchestration Test
 * Demonstrates all 3 agents working together
 */

// Import agents directly from source
import { DashboardOrchestrator, DashboardType } from "../dashboard_agent/src/orchestrator.js";
import { VisualizationMapper } from "../visualization_agent/src/mapper.js";
import { MetricComputer } from "../metric_agent/src/computer.js";

async function orchestrateDashboard() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║          🎯 DASHBOARD ORCHESTRATION TEST                       ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const startTime = Date.now();

  // Initialize agents
  const orchestrator = new DashboardOrchestrator();
  const visualizer = new VisualizationMapper();
  const metrics = new MetricComputer();

  // ===== STEP 1: List Available Dashboards =====
  console.log("📊 STEP 1: Available Dashboard Types");
  console.log("────────────────────────────────────");
  const dashboards = orchestrator.getAvailableDashboards();
  dashboards.forEach((db) => {
    console.log(`  ✓ ${db.type}: ${db.title} (${db.queryCount} queries)`);
  });

  // ===== STEP 2: Parse Dashboard Request =====
  console.log("\n📋 STEP 2: Parse Portfolio Dashboard Request");
  console.log("───────────────────────────────────────────");
  const request = { type: DashboardType.PORTFOLIO };
  const queries = orchestrator.parseDashboardRequest(request);
  console.log(`  ✓ Identified ${queries.length} queries needed:\n`);
  queries.forEach((q) => {
    console.log(`     • ${q.id}`);
    console.log(`       ${q.description}`);
    console.log(`       Query: "${q.query}"\n`);
  });

  // ===== STEP 3: Simulate SQL Agent Execution =====
  console.log("🔄 STEP 3: Simulate SQL Query Execution (Parallel)");
  console.log("──────────────────────────────────────────────────");

  // Mock data from SQL queries
  const mockQueryResults = [
    {
      queryId: "portfolio-value",
      data: [{ total_value: 320000, currency: "USD" }],
      executionTime: 150,
    },
    {
      queryId: "allocation",
      data: [
        { sector: "Technology", value: 150000, percentage: 46.9 },
        { sector: "Healthcare", value: 100000, percentage: 31.25 },
        { sector: "Finance", value: 70000, percentage: 21.875 },
      ],
      executionTime: 120,
    },
    {
      queryId: "top-holdings",
      data: [
        { ticker: "AAPL", shares: 100, price: 150, value: 15000, gain_loss: 2000 },
        { ticker: "MSFT", shares: 50, price: 300, value: 15000, gain_loss: 3000 },
        { ticker: "GOOGL", shares: 75, price: 140, value: 10500, gain_loss: 1500 },
        { ticker: "AMZN", shares: 30, price: 180, value: 5400, gain_loss: 800 },
        { ticker: "NVDA", shares: 25, price: 900, value: 22500, gain_loss: 8200 },
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

  // ===== STEP 4: Visualization Agent - Map to Charts =====
  console.log("🎨 STEP 4: Visualization Mapping");
  console.log("──────────────────────────────");

  const widgets: any[] = [];

  // Widget 1: KPI Card
  const kpiWidget = visualizer.mapVisualization({
    data: mockQueryResults[0].data,
    suggestedType: "kpi",
    title: "Total Portfolio Value",
  });
  widgets.push({
    id: "widget_1",
    ...kpiWidget.config,
    confidence: kpiWidget.confidence,
  });
  console.log(`  ✓ Widget 1: KPI Card - Confidence ${(kpiWidget.confidence * 100).toFixed(0)}%`);

  // Widget 2: Pie Chart
  const pieWidget = visualizer.mapVisualization({
    data: mockQueryResults[1].data,
    suggestedType: "pie",
    title: "Asset Allocation",
  });
  widgets.push({
    id: "widget_2",
    ...pieWidget.config,
    confidence: pieWidget.confidence,
  });
  console.log(`  ✓ Widget 2: Pie Chart - Confidence ${(pieWidget.confidence * 100).toFixed(0)}%`);

  // Widget 3: Table
  const tableWidget = visualizer.mapVisualization({
    data: mockQueryResults[2].data,
    suggestedType: "table",
    title: "Top Holdings",
  });
  widgets.push({
    id: "widget_3",
    ...tableWidget.config,
    confidence: tableWidget.confidence,
  });
  console.log(`  ✓ Widget 3: Table - Confidence ${(tableWidget.confidence * 100).toFixed(0)}%`);

  // Widget 4: Bar Chart
  const barWidget = visualizer.mapVisualization({
    data: mockQueryResults[3].data,
    suggestedType: "bar",
    title: "Portfolio Performance",
  });
  widgets.push({
    id: "widget_4",
    ...barWidget.config,
    confidence: barWidget.confidence,
  });
  console.log(`  ✓ Widget 4: Bar Chart - Confidence ${(barWidget.confidence * 100).toFixed(0)}%\n`);

  // ===== STEP 5: Metric Agent - Compute KPIs =====
  console.log("📈 STEP 5: Metric Computation");
  console.log("─────────────────────────────");

  const metricsResult = metrics.computeMetrics({
    data: mockQueryResults[1].data,
    metricsToCalculate: ["total", "average", "count", "max"],
  });

  console.log(`  ✓ Computed ${metricsResult.metrics.length} metrics:\n`);
  metricsResult.metrics.forEach((m: any) => {
    console.log(`     • ${m.name}: ${m.value} ${m.unit}`);
  });
  console.log();

  // ===== STEP 6: Build Final Dashboard Response =====
  console.log("🏗️  STEP 6: Building Complete Dashboard Response");
  console.log("────────────────────────────────────────────────");

  const totalTime = Date.now() - startTime;

  const dashboard = await orchestrator.buildDashboardResponse(
    request,
    mockQueryResults.map((r) => ({
      ...r,
      error: undefined,
    })),
    totalTime
  );

  console.log(`  ✓ Dashboard ID: ${dashboard.id}`);
  console.log(`  ✓ Type: ${dashboard.type}`);
  console.log(`  ✓ Widgets: ${dashboard.widgets.length}`);
  console.log(`  ✓ Total execution time: ${totalTime}ms\n`);

  // ===== FINAL RESPONSE =====
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("📊 FINAL DASHBOARD JSON");
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
        config: {
          chartType: w.type,
          confidence: w.confidence,
        },
        dataRowCount: w.data?.length || 0,
      })),
      metrics: metricsResult.metrics.map((m: any) => ({
        name: m.name,
        value: m.value,
        unit: m.unit,
        category: m.category,
      })),
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

  // Summary
  console.log("📊 EXECUTION SUMMARY:");
  console.log("────────────────────");
  console.log(`  Orchestrator: ✓ Parsed request → Identified ${queries.length} queries`);
  console.log(`  SQL Agent:    ✓ Executed 4 queries in parallel (${queryTime}ms)`);
  console.log(`  Visualizer:   ✓ Mapped to 4 chart widgets`);
  console.log(`  Metrics:      ✓ Computed ${metricsResult.metrics.length} KPIs`);
  console.log(`  Total Time:   ${totalTime}ms\n`);

  console.log("🎯 This dashboard is now ready to be:");
  console.log("   1. Sent via Express API endpoint");
  console.log("   2. Rendered by React frontend");
  console.log("   3. Displayed in browser at http://localhost:3000/dashboard\n");
}

orchestrateDashboard().catch(console.error);
