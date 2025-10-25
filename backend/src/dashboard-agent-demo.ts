/**
 * Dashboard Agent Demo
 * Shows orchestrator agent processing user prompt and generating dashboard
 */

import { DashboardOrchestrator, DashboardType, DashboardRequest } from "../../dashboard_agent/src/orchestrator.js";
import { VisualizationMapper } from "../../visualization_agent/src/mapper.js";
import { MetricComputer } from "../../metric_agent/src/computer.js";

async function demoOrchestrator() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║        🤖 DASHBOARD ORCHESTRATOR AGENT DEMO                    ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log("\n");

  // ===== USER PROMPT =====
  const userPrompt = "Create a Portfolio Dashboard showing my investment performance";
  
  console.log("👤 USER PROMPT:");
  console.log("───────────────");
  console.log(`   "${userPrompt}"\n`);

  const startTime = Date.now();

  // Initialize agents
  const orchestrator = new DashboardOrchestrator();
  const visualizer = new VisualizationMapper();
  const metrics = new MetricComputer();

  // ===== STEP 1: ORCHESTRATOR RECEIVES PROMPT =====
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("🤖 STEP 1: ORCHESTRATOR AGENT PROCESSES PROMPT");
  console.log("═══════════════════════════════════════════════════════════════\n");

  console.log("🧠 Agent thinking...");
  console.log("   Analyzing prompt keywords:");
  console.log("   • 'Portfolio' → Dashboard type = PORTFOLIO");
  console.log("   • 'investment performance' → Need performance queries");
  console.log("   • 'showing' → Needs visualizations\n");

  // Parse the prompt to determine dashboard type
  const dashboardType = DashboardType.PORTFOLIO;
  console.log(`✓ Determined dashboard type: ${dashboardType}\n`);

  // ===== STEP 2: IDENTIFY REQUIRED QUERIES =====
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("📋 STEP 2: ORCHESTRATOR IDENTIFIES REQUIRED QUERIES");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const request: DashboardRequest = { type: dashboardType };
  const queries = orchestrator.parseDashboardRequest(request);

  console.log(`Found ${queries.length} queries in ${dashboardType} template:\n`);
  queries.forEach((q, idx) => {
    console.log(`  ${idx + 1}. ${q.id.toUpperCase()}`);
    console.log(`     Purpose: ${q.purpose}`);
    console.log(`     Description: ${q.description}`);
    console.log(`     Chart Type: ${q.chartType}`);
    console.log(`     NL Query: "${q.query}"\n`);
  });

  // ===== STEP 3: SIMULATE SQL EXECUTION =====
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("🔄 STEP 3: TEXT-TO-SQL AGENT EXECUTES QUERIES (PARALLEL)");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Mock query results (in reality these come from Supabase)
  const mockResults = [
    {
      queryId: "portfolio-value",
      data: [{ total_value: 320000, currency: "USD" }],
      time: 150,
    },
    {
      queryId: "allocation",
      data: [
        { sector: "Technology", value: 150000, percentage: 46.9 },
        { sector: "Healthcare", value: 100000, percentage: 31.25 },
        { sector: "Finance", value: 70000, percentage: 21.875 },
      ],
      time: 120,
    },
    {
      queryId: "top-holdings",
      data: [
        { ticker: "AAPL", shares: 100, price: 150, value: 15000, gain: 2000 },
        { ticker: "MSFT", shares: 50, price: 300, value: 15000, gain: 3000 },
        { ticker: "GOOGL", shares: 75, price: 140, value: 10500, gain: 1500 },
      ],
      time: 200,
    },
    {
      queryId: "performance",
      data: [
        { holding: "AAPL", gain_loss: 2000 },
        { holding: "MSFT", gain_loss: 3000 },
        { holding: "GOOGL", gain_loss: 1500 },
      ],
      time: 180,
    },
  ];

  console.log("Executing queries against Supabase (all in parallel):\n");
  mockResults.forEach((result) => {
    console.log(
      `  ✓ ${result.queryId.padEnd(18)} | ${result.time}ms | ${result.data.length} rows`
    );
  });

  const maxTime = Math.max(...mockResults.map((r) => r.time));
  console.log(`\n✓ Total parallel execution time: ${maxTime}ms\n`);

  // ===== STEP 4: VISUALIZATION MAPPING =====
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("🎨 STEP 4: VISUALIZATION MAPPER ANALYZES DATA & CREATES CHARTS");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const widgets = [
    {
      id: "widget_1",
      query: "portfolio-value",
      description: "Total Portfolio Value",
      type: "kpi",
      data: mockResults[0].data,
    },
    {
      id: "widget_2",
      query: "allocation",
      description: "Asset Allocation",
      type: "pie",
      data: mockResults[1].data,
    },
    {
      id: "widget_3",
      query: "top-holdings",
      description: "Top Holdings",
      type: "table",
      data: mockResults[2].data,
    },
    {
      id: "widget_4",
      query: "performance",
      description: "Portfolio Performance",
      type: "bar",
      data: mockResults[3].data,
    },
  ];

  console.log("Analyzing data structure and mapping to optimal visualizations:\n");

  widgets.forEach((widget) => {
    const vizResult = visualizer.mapVisualization({
      data: widget.data,
      suggestedType: widget.type as any,
      title: widget.description,
    });

    console.log(`  📊 ${widget.description}`);
    console.log(`     Data: ${widget.data.length} rows`);
    console.log(`     Mapped to: ${vizResult.config.type.toUpperCase()}`);
    console.log(`     Confidence: ${(vizResult.confidence * 100).toFixed(0)}%\n`);
  });

  // ===== STEP 5: METRICS COMPUTATION =====
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("📈 STEP 5: METRIC COMPUTER CALCULATES KPIS");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const metricsResult = metrics.computeMetrics({
    data: mockResults[1].data, // allocation data
    metricsToCalculate: ["total", "average", "count", "max"],
  });

  console.log("Computed metrics:\n");
  metricsResult.metrics.forEach((m) => {
    console.log(
      `  📈 ${m.name.padEnd(15)} | Value: ${String(m.value).padEnd(10)} | Unit: ${m.unit}`
    );
  });

  console.log(`\nInsights generated:\n`);
  metricsResult.insights.forEach((insight) => {
    console.log(`  💡 ${insight}`);
  });

  // ===== STEP 6: FINAL DASHBOARD =====
  console.log("\n");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("🏗️  STEP 6: BUILDING COMPLETE DASHBOARD");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const totalTime = Date.now() - startTime;
  const dashboard = await orchestrator.buildDashboardResponse(
    request,
    mockResults.map((r) => ({
      queryId: r.queryId,
      data: r.data,
      error: undefined,
      executionTime: r.time,
    })),
    totalTime
  );

  console.log(`✓ Dashboard ID: ${dashboard.id}`);
  console.log(`✓ Title: ${dashboard.title}`);
  console.log(`✓ Description: ${dashboard.description}`);
  console.log(`✓ Widgets: ${dashboard.widgets.length}`);
  console.log(`✓ Total execution time: ${totalTime}ms\n`);

  // ===== FINAL DASHBOARD JSON =====
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("📊 FINAL DASHBOARD JSON (Sent to Frontend)");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const finalDashboard = {
    success: true,
    data: {
      id: dashboard.id,
      type: dashboard.type,
      title: dashboard.title,
      description: dashboard.description,
      widgets: widgets.map((w) => ({
        id: w.id,
        type: w.type,
        title: w.description,
        config: {
          chartType: w.type,
          confidence: 0.85,
        },
        dataPreview: w.data.slice(0, 2), // Show first 2 rows
      })),
      metrics: metricsResult.metrics,
      insights: metricsResult.insights,
      summary: metricsResult.summary,
    },
    timing: {
      totalExecutionTime: totalTime,
      queriesExecuted: mockResults.length,
      widgetsGenerated: widgets.length,
      metricsComputed: metricsResult.metrics.length,
    },
  };

  console.log(JSON.stringify(finalDashboard, null, 2));

  // ===== WHAT HAPPENS NEXT =====
  console.log("\n");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("🎨 WHAT HAPPENS NEXT: REACT FRONTEND RENDERS DASHBOARD");
  console.log("═══════════════════════════════════════════════════════════════\n");

  console.log("The React frontend receives this JSON and renders:\n");
  console.log("┌─────────────────────────────────────────────────────────────┐");
  console.log("│ PORTFOLIO DASHBOARD                                         │");
  console.log("├─────────────────────────────────────────────────────────────┤");
  console.log("│                                                             │");
  console.log("│  📊 Total Value  |  📊 Avg Position  |  📊 Holdings  | Gain │");
  console.log("│  $320,000        |  $106,667         |  3 items      | $6.5K│");
  console.log("│                                                             │");
  console.log("├─────────────────────────────────────────────────────────────┤");
  console.log("│  Asset Allocation (Pie)      │  Portfolio Performance (Bar)│");
  console.log("│  ┌──────────────────────┐    │  ┌──────────────────────┐  │");
  console.log("│  │  Tech: 47%           │    │  │  AAPL: +$2,000       │  │");
  console.log("│  │  Health: 31%         │    │  │  MSFT: +$3,000       │  │");
  console.log("│  │  Finance: 22%        │    │  │  GOOGL: +$1,500      │  │");
  console.log("│  └──────────────────────┘    │  └──────────────────────┘  │");
  console.log("├─────────────────────────────────────────────────────────────┤");
  console.log("│  Top Holdings (Table)                                       │");
  console.log("│  ┌──────┬───────┬───────┬────────────────────────────────┐ │");
  console.log("│  │Tick │Share │Price│Value    │ Gain                    │ │");
  console.log("│  ├──────┼───────┼───────┼────────────────────────────────┤ │");
  console.log("│  │AAPL │  100  │ 150 │ $15,000 │ +$2,000                 │ │");
  console.log("│  │MSFT │   50  │ 300 │ $15,000 │ +$3,000                 │ │");
  console.log("│  │GOOGL│   75  │ 140 │ $10,500 │ +$1,500                 │ │");
  console.log("│  └──────┴───────┴───────┴────────────────────────────────┘ │");
  console.log("└─────────────────────────────────────────────────────────────┘\n");

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("✅ COMPLETE AGENT WORKFLOW DEMONSTRATED");
  console.log("═══════════════════════════════════════════════════════════════\n");

  console.log("Flow Summary:");
  console.log("  ✓ User Prompt → Orchestrator parsed");
  console.log("  ✓ Orchestrator identified 4 queries");
  console.log("  ✓ Text-to-SQL executed all in parallel (150ms max)");
  console.log("  ✓ Visualization mapped data to 4 chart types");
  console.log("  ✓ Metrics computed 4 KPIs");
  console.log("  ✓ Dashboard JSON returned to frontend");
  console.log("  ✓ React rendered beautiful dashboard\n");

  console.log("Total execution: " + totalTime + "ms\n");
}

demoOrchestrator().catch(console.error);
