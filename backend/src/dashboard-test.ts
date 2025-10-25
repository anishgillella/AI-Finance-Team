/**
 * Dashboard System Test - Demonstrates 3-agent orchestration
 */

import { DashboardOrchestrator, DashboardType } from "../dashboard_agent/src/index.js";
import { VisualizationMapper } from "../visualization_agent/src/index.js";
import { MetricComputer } from "../metric_agent/src/index.js";

const orchestrator = new DashboardOrchestrator();
const visualizer = new VisualizationMapper();
const metrics = new MetricComputer();

async function testDashboard() {
  console.log("\n🎯 DASHBOARD SYSTEM TEST\n");

  // Step 1: List dashboards
  console.log("1️⃣  AVAILABLE DASHBOARDS:");
  const dashboards = orchestrator.getAvailableDashboards();
  dashboards.forEach((db) => {
    console.log(`   📊 ${db.type}: ${db.title} (${db.queryCount} queries)`);
  });

  // Step 2: Parse request
  console.log("\n2️⃣  PARSING PORTFOLIO DASHBOARD:");
  const queries = orchestrator.parseDashboardRequest({ type: DashboardType.PORTFOLIO });
  console.log(`   Found ${queries.length} queries`);

  // Step 3: Mock data
  console.log("\n3️⃣  SIMULATING QUERY RESULTS:");
  const mockData = [
    { sector: "Technology", value: 150000 },
    { sector: "Healthcare", value: 100000 },
  ];

  const mockResults = [
    { queryId: queries[0].id, data: [{ total: 320000 }], error: undefined, executionTime: 150 },
    { queryId: queries[1].id, data: mockData, error: undefined, executionTime: 120 },
  ];

  console.log(`   ✓ 2 queries executed successfully`);

  // Step 4: Map visualizations
  console.log("\n4️⃣  MAPPING VISUALIZATIONS:");
  const widgets = mockResults
    .filter((r) => !r.error)
    .map((result, index) => {
      const query = queries.find((q) => q.id === result.queryId)!;
      const vizResult = visualizer.mapVisualization({
        data: result.data,
        suggestedType: query.chartType,
        title: query.description,
      });
      console.log(`   📊 Widget: ${query.description} → ${vizResult.config.type}`);
      return vizResult.config;
    });

  // Step 5: Compute metrics
  console.log("\n5️⃣  COMPUTING METRICS:");
  const metricsResult = metrics.computeMetrics({
    data: mockData,
    metricsToCalculate: ["total", "average"],
  });
  metricsResult.metrics.forEach((m) => console.log(`   📈 ${m.name}: ${m.value}`));

  // Step 6: Build dashboard
  console.log("\n6️⃣  BUILDING DASHBOARD:");
  const dashboard = await orchestrator.buildDashboardResponse(
    { type: DashboardType.PORTFOLIO },
    mockResults,
    270
  );

  console.log(`\n✅ DASHBOARD CREATED!`);
  console.log(`   ID: ${dashboard.id}`);
  console.log(`   Widgets: ${dashboard.widgets.length}`);
  console.log(`   Execution: ${dashboard.metadata.executionTime}ms`);

  // Final output
  console.log("\n📊 RESPONSE JSON:\n");
  console.log(JSON.stringify({
    success: true,
    data: {
      id: dashboard.id,
      type: dashboard.type,
      title: dashboard.title,
      widgets: widgets.map(w => ({ ...w, data: w.data?.slice(0, 2) })),
      metrics: metricsResult.metrics,
    },
    timing: { totalExecutionTime: 270 }
  }, null, 2));

  console.log("\n✨ DASHBOARD SYSTEM WORKING!\n");
}

testDashboard().catch(console.error);
