import { Router, Request, Response } from 'express';
import { getAnalysis, getUploadedFile } from '../db/supabase.js';

const router = Router();

router.get('/analysis/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;

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
        error: 'No analysis found for this file. Please run a query first.'
      });
      return;
    }

    res.json({
      success: true,
      file_id: fileId,
      analysis: analysis.analysis_data,
      created_at: analysis.created_at,
      updated_at: analysis.updated_at
    });

  } catch (error) {
    console.error('Analysis retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve analysis'
    });
  }
});

router.get('/files/:fileId', async (req: Request, res: Response) => {
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

    res.json({
      success: true,
      file: {
        id: file.id,
        filename: file.filename,
        upload_date: file.upload_date,
        record_count: file.record_count,
        date_range: {
          start: file.date_range_start,
          end: file.date_range_end
        },
        status: file.status
      }
    });

  } catch (error) {
    console.error('File retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve file'
    });
  }
});

export default router;
