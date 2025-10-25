import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { runFinanceAgent } from './agent/graph.js';
import fs from 'fs';
import uploadRoutes from './routes/upload.js';
import queryRoutes from './routes/query.js';
import analysisRoutes from './routes/analysis.js';
import reportsRoutes from './routes/reports.js';
import { ensureUploadDir } from './utils/fileHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;
const args = process.argv.slice(2);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure upload directory exists
ensureUploadDir();

// Routes
app.use('/api', uploadRoutes);
app.use('/api', queryRoutes);
app.use('/api', analysisRoutes);
app.use('/api', reportsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'AI Finance Agent API' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'AI Finance Agent API',
    version: '1.0.0',
    endpoints: {
      upload: 'POST /api/upload',
      query: 'POST /api/query',
      analysis: 'GET /api/analysis/:fileId',
      reports: 'GET /api/reports/:fileId',
      fileInfo: 'GET /api/files/:fileId',
      health: 'GET /health'
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// CLI Mode - if arguments provided, run as CLI
async function runCLI() {
  if (args.length === 0) {
    return false; // No args, run as server
  }

  console.log('📊 AI Finance Agent - LangGraph with GPT-4o (CLI Mode)\n');
  
  const csvPath = args[0];
  const query = args[1];

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`);
    process.exit(1);
  }

  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not set in .env');
    process.exit(1);
  }

  try {
    const result = await runFinanceAgent(csvPath, query);
    console.log('\n📈 Analysis Complete!\n');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Start server
async function start() {
  const isCliMode = await runCLI();
  
  if (!isCliMode) {
    app.listen(PORT, () => {
      console.log(`\n🚀 AI Finance Agent API running on http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}`);
      console.log(`💚 Health check: http://localhost:${PORT}/health\n`);
    });
  }
}

start().catch(console.error);
