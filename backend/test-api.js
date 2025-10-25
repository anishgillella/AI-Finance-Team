/**
 * Quick API Test - Simulates dashboard requests without needing frontend
 */

const http = require('http');

// Mock data for testing
const mockDashboard = {
  success: true,
  data: {
    id: "dashboard_1729872345_test123",
    type: "PORTFOLIO",
    title: "Portfolio Dashboard",
    description: "View your investment portfolio performance and allocation",
    widgets: [
      {
        id: "widget_1",
        type: "kpi",
        title: "Total Portfolio Value",
        data: [{ value: 320000 }],
        config: { type: "kpi", value: "$320,000", unit: "" }
      },
      {
        id: "widget_2",
        type: "chart",
        title: "Asset Allocation",
        data: [
          { name: "Technology", value: 150000 },
          { name: "Healthcare", value: 100000 },
          { name: "Finance", value: 70000 }
        ],
        config: { type: "pie" }
      },
      {
        id: "widget_3",
        type: "table",
        title: "Top Holdings",
        data: [
          { ticker: "AAPL", shares: 100, price: 150, value: 15000 },
          { ticker: "MSFT", shares: 50, price: 300, value: 15000 },
          { ticker: "GOOGL", shares: 75, price: 140, value: 10500 }
        ],
        config: { type: "table" }
      },
      {
        id: "widget_4",
        type: "chart",
        title: "Performance",
        data: [
          { holding: "AAPL", gain_loss: 2000 },
          { holding: "MSFT", gain_loss: 3000 },
          { holding: "GOOGL", gain_loss: 1500 }
        ],
        config: { type: "bar" }
      }
    ],
    metrics: [
      { name: "Total Value", value: 320000, unit: "$" },
      { name: "Average Position", value: 80000, unit: "$" },
      { name: "Total Holdings", value: 3, unit: "items" },
      { name: "Portfolio Gain", value: 6500, unit: "$" }
    ],
    insights: [
      "Analyzed 3 holdings with total value of $320,000",
      "📈 Portfolio showing strong performance with $6,500 total gains"
    ],
    summary: "Calculated 4 metrics from 3 data points"
  },
  timing: {
    totalExecutionTime: 450,
    queriesExecuted: 4,
    widgetsGenerated: 4
  }
};

// Simple HTTP server
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: "✓ API running", timestamp: new Date().toISOString() }));
  } else if (req.url === '/api/dashboard/available' && req.method === 'GET') {
    const available = [
      { type: "PORTFOLIO", title: "Portfolio Dashboard", description: "Portfolio tracking", queryCount: 4 },
      { type: "TRANSACTIONS", title: "Transactions Dashboard", description: "Transaction history", queryCount: 4 },
      { type: "BUDGETS", title: "Budget Dashboard", description: "Budget tracking", queryCount: 4 },
      { type: "FINANCIAL_GOALS", title: "Financial Goals Dashboard", description: "Goal monitoring", queryCount: 4 }
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: available }));
  } else if (req.url === '/api/dashboard/generate' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockDashboard));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: "Not found" }));
  }
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`\n🎯 TEST API SERVER RUNNING\n`);
  console.log(`📊 Backend: http://localhost:${PORT}`);
  console.log(`\nTest endpoints:`);
  console.log(`  GET  http://localhost:${PORT}/health`);
  console.log(`  GET  http://localhost:${PORT}/api/dashboard/available`);
  console.log(`  POST http://localhost:${PORT}/api/dashboard/generate`);
  console.log(`\n🎨 Frontend: http://localhost:3000/dashboard`);
  console.log(`\nOpen http://localhost:3000/dashboard in your browser\n`);
});
