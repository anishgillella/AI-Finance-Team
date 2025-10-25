import http from 'http';
import { URL } from 'url';

// Import the new modules (when compiled)
// Note: These will be available after building TypeScript files
// For now, we'll create a mock handler

async function generateDynamicDashboard(prompt) {
  // This will call the backend TypeScript modules once they're compiled
  // For MVP, we'll return structured mock data
  
  return {
    success: true,
    data: {
      id: `dashboard_${Date.now()}`,
      type: 'DYNAMIC',
      title: 'Custom Dashboard',
      description: `Generated from: "${prompt}"`,
      widgets: [
        {
          id: 'widget_1',
          type: 'kpi',
          title: 'Total Value',
          data: [{ value: 320000 }],
          config: { type: 'kpi', value: '$320,000', unit: '' }
        },
        {
          id: 'widget_2',
          type: 'chart',
          title: 'Breakdown',
          data: [
            { category: 'Technology', value: 150000 },
            { category: 'Healthcare', value: 100000 },
            { category: 'Finance', value: 70000 }
          ],
          config: { type: 'pie' }
        }
      ],
      metrics: [
        { name: 'Total Value', value: 320000, unit: '$' },
        { name: 'Total Items', value: 3, unit: 'items' }
      ],
      insights: ['Dashboard generated from your prompt'],
      summary: 'Dynamic dashboard created successfully'
    },
    timing: { totalExecutionTime: 1200, queriesExecuted: 2, widgetsGenerated: 2 }
  };
}

function generateDashboard(type = 'PORTFOLIO') {
  const dashboards = {
    PORTFOLIO: {
      id: `dashboard_${Date.now()}`,
      type: 'PORTFOLIO',
      title: 'Portfolio Dashboard',
      description: 'View your investment portfolio performance',
      widgets: [
        {
          id: 'widget_1',
          type: 'kpi',
          title: 'Total Portfolio Value',
          data: [{ value: 320000 }],
          config: { type: 'kpi', value: '$320,000', unit: '' }
        },
        {
          id: 'widget_2',
          type: 'chart',
          title: 'Asset Allocation',
          data: [
            { sector: 'Technology', value: 150000 },
            { sector: 'Healthcare', value: 100000 },
            { sector: 'Finance', value: 70000 }
          ],
          config: { type: 'pie' }
        },
        {
          id: 'widget_3',
          type: 'table',
          title: 'Top Holdings',
          data: [
            { ticker: 'AAPL', shares: 100, price: 150, value: 15000 },
            { ticker: 'MSFT', shares: 50, price: 300, value: 15000 },
            { ticker: 'GOOGL', shares: 75, price: 140, value: 10500 }
          ],
          config: { type: 'table' }
        },
        {
          id: 'widget_4',
          type: 'chart',
          title: 'Portfolio Performance',
          data: [
            { holding: 'AAPL', gain_loss: 2000 },
            { holding: 'MSFT', gain_loss: 3000 },
            { holding: 'GOOGL', gain_loss: 1500 }
          ],
          config: { type: 'bar' }
        }
      ],
      metrics: [
        { name: 'Total Value', value: 320000, unit: '$' },
        { name: 'Average Position', value: 80000, unit: '$' },
        { name: 'Total Holdings', value: 3, unit: 'items' },
        { name: 'Portfolio Gain', value: 6500, unit: '$' }
      ],
      insights: ['Analyzed 3 holdings', 'Strong performance with $6,500 gains'],
      summary: '4 metrics from 3 holdings'
    },
    TRANSACTIONS: {
      id: `dashboard_${Date.now()}`,
      type: 'TRANSACTIONS',
      title: 'Transactions Dashboard',
      description: 'Review all your recent transactions',
      widgets: [
        {
          id: 'widget_1',
          type: 'chart',
          title: 'Recent Transactions',
          data: [
            { date: '2024-10-25', amount: 5000, type: 'Buy' },
            { date: '2024-10-24', amount: 3000, type: 'Buy' },
            { date: '2024-10-23', amount: 2000, type: 'Sell' }
          ],
          config: { type: 'bar' }
        }
      ],
      metrics: [
        { name: 'Total Transactions', value: 150, unit: 'tx' },
        { name: 'This Month', value: 45, unit: 'tx' },
        { name: 'Buy Orders', value: 95, unit: 'tx' },
        { name: 'Sell Orders', value: 55, unit: 'tx' }
      ],
      insights: ['45 transactions this month', 'More buys than sells'],
      summary: 'Latest transaction data'
    },
    BUDGETS: {
      id: `dashboard_${Date.now()}`,
      type: 'BUDGETS',
      title: 'Budgets Dashboard',
      description: 'Manage your financial budgets',
      widgets: [
        {
          id: 'widget_1',
          type: 'chart',
          title: 'Budget Allocation',
          data: [
            { category: 'Housing', budget: 2000 },
            { category: 'Food', budget: 800 },
            { category: 'Transport', budget: 500 },
            { category: 'Entertainment', budget: 300 }
          ],
          config: { type: 'pie' }
        }
      ],
      metrics: [
        { name: 'Total Budget', value: 3600, unit: '$' },
        { name: 'Spent', value: 2850, unit: '$' },
        { name: 'Remaining', value: 750, unit: '$' },
        { name: 'Budget Health', value: 79, unit: '%' }
      ],
      insights: ['79% of budget used', 'On track for month'],
      summary: 'Budget status: On track'
    },
    FINANCIAL_GOALS: {
      id: `dashboard_${Date.now()}`,
      type: 'FINANCIAL_GOALS',
      title: 'Financial Goals Dashboard',
      description: 'Track your financial goals progress',
      widgets: [
        {
          id: 'widget_1',
          type: 'chart',
          title: 'Goal Progress',
          data: [
            { goal: 'Savings', progress: 65 },
            { goal: 'Debt Reduction', progress: 45 },
            { goal: 'Retirement', progress: 72 }
          ],
          config: { type: 'bar' }
        }
      ],
      metrics: [
        { name: 'Active Goals', value: 3, unit: 'goals' },
        { name: 'On Track', value: 2, unit: 'goals' },
        { name: 'At Risk', value: 1, unit: 'goals' },
        { name: 'Avg Progress', value: 61, unit: '%' }
      ],
      insights: ['67% of goals on track', 'Strong savings progress'],
      summary: 'Progressing well towards goals'
    }
  };

  return {
    success: true,
    data: dashboards[type] || dashboards.PORTFOLIO,
    timing: { totalExecutionTime: 450, queriesExecuted: 4, widgetsGenerated: 4 }
  };
}

const server = http.createServer((req, res) => {
  // CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // NEW ENDPOINT: Generate dashboard from natural language prompt
  if (url.pathname === '/api/dashboard/from-prompt' && req.method === 'POST') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body);
        const prompt = parsed.prompt;

        if (!prompt) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: 'Missing prompt field' }));
          return;
        }

        console.log(`\n🎯 Generating dashboard from prompt: "${prompt}"`);

        // Generate dashboard from prompt
        const dashboard = await generateDynamicDashboard(prompt);

        res.writeHead(200);
        res.end(JSON.stringify(dashboard, null, 2));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: `Invalid request: ${err.message}` }));
      }
    });
    return;
  }

  // Handle dashboard generation endpoint (existing hardcoded)
  if (url.pathname === '/api/dashboard/generate' && req.method === 'POST') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        const dashboardType = parsed.type || 'PORTFOLIO';
        const dashboard = generateDashboard(dashboardType);
        res.writeHead(200);
        res.end(JSON.stringify(dashboard, null, 2));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Invalid request body' }));
      }
    });
    return;
  }

  // Default endpoint for health check
  if (url.pathname === '/') {
    res.writeHead(200);
    res.end(JSON.stringify(generateDashboard(), null, 2));
    return;
  }

  // 404
  res.writeHead(404);
  res.end(JSON.stringify({ success: false, error: 'Not found' }));
});

const PORT = 8888;
server.listen(PORT, () => console.log(`✅ API running on http://localhost:${PORT}`));
