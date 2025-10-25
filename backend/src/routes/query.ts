import { Router, Request, Response } from 'express';
import { runFinanceAgent } from '../agent/graph.js';
import { getUploadedFile, getAnalysis, saveAnalysis } from '../db/supabase.js';
import { Analysis, QueryRequest } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/query', async (req: Request, res: Response) => {
  try {
    const { file_id, query } = req.body as QueryRequest;

    if (!file_id || !query) {
      res.status(400).json({
        success: false,
        error: 'file_id and query are required'
      });
      return;
    }

    // Get file from database
    const file = await getUploadedFile(file_id);
    if (!file) {
      res.status(404).json({
        success: false,
        error: 'File not found'
      });
      return;
    }

    // Run finance agent
    console.log(`\n🔄 Processing query for file: ${file_id}`);
    console.log(`📝 Query: ${query}\n`);

    const agentState = await runFinanceAgent(file.file_path, query);

    // Save analysis if not already saved
    let analysis = await getAnalysis(file_id);
    if (!analysis) {
      analysis = {
        id: uuidv4(),
        file_id,
        analysis_data: agentState,
        created_at: new Date(),
        updated_at: new Date()
      };
      await saveAnalysis(analysis);
    }

    res.json({
      success: true,
      answer: agentState.chat_history[agentState.chat_history.length - 1]?.content || 'No response',
      analysis: agentState.analysis,
      evaluation: agentState.evaluation,
      chat_history: agentState.chat_history
    });

  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Query processing failed'
    });
  }
});

export default router;
