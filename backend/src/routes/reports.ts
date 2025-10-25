import { Router, Request, Response } from 'express';
import { getAnalysis, getUploadedFile } from '../db/supabase.js';
import { AnalysisResult } from '../types/index.js';

const router = Router();

// Generate report data (JSON format)
router.get('/reports/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const format = (req.query.format || 'json') as string;

    if (!fileId) {
      res.status(400).json({
        success: false,
        error: 'fileId is required'
      });
      return;
    }

    // Verify file exists
    const file = await getUploadedFile(fileId);
    if (!file) {
      res.status(404).json({
        success: false,
        error: 'File not found'
      });
      return;
    }

    // Get analysis
    const analysis = await getAnalysis(fileId);
    if (!analysis) {
      res.status(404).json({
        success: false,
        error: 'No analysis found. Please run a query first.'
      });
      return;
    }

    const reportData = {
      metadata: {
        filename: file.filename,
        upload_date: file.upload_date,
        record_count: file.record_count,
        date_range: {
          start: file.date_range_start,
          end: file.date_range_end
        },
        generated_at: new Date()
      },
      analysis: analysis.analysis_data.analysis,
      evaluation: analysis.analysis_data.evaluation,
      summary: analysis.analysis_data.summary,
      chat_history: analysis.analysis_data.chat_history
    };

    if (format === 'csv') {
      // CSV format - KPI data
      const csvContent = generateKPICSV(reportData.analysis);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analysis-${fileId}.csv"`);
      res.send(csvContent);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analysis-${fileId}.json"`);
      res.json({
        success: true,
        report: reportData
      });
    }

  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate report'
    });
  }
});

// Get report summary (lightweight endpoint)
router.get('/reports/:fileId/summary', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;

    if (!fileId) {
      res.status(400).json({
        success: false,
        error: 'fileId is required'
      });
      return;
    }

    const file = await getUploadedFile(fileId);
    if (!file) {
      res.status(404).json({
        success: false,
        error: 'File not found'
      });
      return;
    }

    const analysis = await getAnalysis(fileId);
    if (!analysis) {
      res.status(404).json({
        success: false,
        error: 'No analysis found'
      });
      return;
    }

    res.json({
      success: true,
      summary: {
        filename: file.filename,
        record_count: file.record_count,
        kpis: analysis.analysis_data.analysis?.kpis || [],
        anomalies_count: analysis.analysis_data.analysis?.anomalies.length || 0,
        overall_score: analysis.analysis_data.evaluation?.overall_score || 0,
        executive_summary: analysis.analysis_data.summary
      }
    });

  } catch (error) {
    console.error('Summary retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve summary'
    });
  }
});

function generateKPICSV(analysis: AnalysisResult | undefined): string {
  if (!analysis || !analysis.kpis) {
    return 'KPI,Value,Unit\n';
  }

  const header = 'KPI,Value,Unit,Trend,Percent Change\n';
  const rows = analysis.kpis.map(kpi =>
    `"${kpi.name}",${kpi.value},"${kpi.unit}","${kpi.trend || 'N/A'}",${kpi.percentChange || 0}`
  ).join('\n');

  return header + rows;
}

export default router;
