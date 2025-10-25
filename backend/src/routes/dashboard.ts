/**
 * Dashboard API Routes
 * Orchestrates: Dashboard Agent → SQL Agent → Visualization Agent → Metric Agent
 */

import express, { Request, Response } from "express";
import { DashboardOrchestrator, DashboardRequest, DashboardType } from "../../dashboard_agent/index.js";
import { VisualizationMapper } from "../../visualization_agent/index.js";
import { MetricComputer } from "../../metric_agent/index.js";
import { runFinanceAgent } from "../agent/finance-agent.js";

const router = express.Router();

const orchestrator = new DashboardOrchestrator();
const visualizer = new VisualizationMapper();
const metrics = new MetricComputer();

/**
 * GET /api/dashboard/available
 * List all dashboard types
 */
router.get("/available", (req: Request, res: Response) => {
  try {
    const dashboards = orchestrator.getAvailableDashboards();
    res.json({ success: true, data: dashboards, count: dashboards.length });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * POST /api/dashboard/generate
 * Generate complete dashboard with data and visualizations
 */
router.post("/generate", async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const request: DashboardRequest = {
      type: req.body.type || DashboardType.PORTFOLIO,
      filters: req.body.filters,
      timeRange: req.body.timeRange,
    };

    console.log(`\n🚀 Generating ${request.type} dashboard...`);

    // Step 1: Parse request
    const queries = orchestrator.parseDashboardRequest(request);
    const nlQueries = orchestrator.prepareQueries(queries);

    if (nlQueries.length === 0) {
      return res.status(400).json({ success: false, error: "No queries found" });
    }

    // Step 2: Execute SQL queries IN PARALLEL (KEY ADVANTAGE)
    console.log(`\n📊 Executing ${nlQueries.length} queries in parallel...`);
    const sqlResults = await Promise.all(
      nlQueries.map(async (query, index) => {
        try {
          const result = await runFinanceAgent(query);
          return {
            queryId: queries[index].id,
            data: result.rawData,
            error: undefined,
            executionTime: Date.now() - startTime,
          };
        } catch (error) {
          return {
            queryId: queries[index].id,
            data: [],
            error: String(error),
            executionTime: Date.now() - startTime,
          };
        }
      })
    );

    const successCount = sqlResults.filter((r) => !r.error).length;
    console.log(`   ✓ ${successCount}/${sqlResults.length} queries succeeded`);

    // Step 3: Map to visualizations
    console.log(`\n🎨 Mapping visualizations...`);
    const widgets = sqlResults
      .filter((result) => !result.error)
      .map((result, index) => {
        const query = queries.find((q) => q.id === result.queryId)!;
        const vizResult = visualizer.mapVisualization({
          data: result.data,
          suggestedType: query.chartType,
          title: query.description,
        });
        return { ...vizResult.config, id: `widget_${index + 1}` };
      });

    // Step 4: Compute metrics
    console.log(`\n📈 Computing metrics...`);
    const primaryData = sqlResults.find((r) => !r.error)?.data || [];
    const metricsResult = metrics.computeMetrics({
      data: primaryData,
      metricsToCalculate: ["total", "average", "count", "max"],
    });

    const totalTime = Date.now() - startTime;
    const dashboard = await orchestrator.buildDashboardResponse(
      request,
      sqlResults,
      totalTime
    );

    res.json({
      success: true,
      data: {
        ...dashboard,
        widgets,
        metrics: metricsResult.metrics,
        summary: metricsResult.summary,
        insights: metricsResult.insights,
      },
      timing: {
        totalExecutionTime: totalTime,
        queriesExecuted: sqlResults.length,
        widgetsGenerated: widgets.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;
