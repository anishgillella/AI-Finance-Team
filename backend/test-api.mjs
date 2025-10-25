/**
 * Test Dashboard API - Full integration demo
 */

import http from 'http';
import url from 'url';

// Dashboard generator
function generateDashboard() {
  return {
    success: true,
    data: {
      id: `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'PORTFOLIO',
      title: 'Portfolio Dashboard',
      description: 'View your investment portfolio performance and allocation',
      widgets: [
        {
          id: 'widget_1',
          type: 'kpi',
          title: 'Total Portfolio Value',
          config: { type: 'kpi', value: '$320,000', unit: '' },
          data: [{ value: 320000 }]
        },
        {
          id: 'widget_2',
          type: 'chart',
          title: 'Asset Allocation',
          config: { type: 'pie' },
          data: [
            { sector: 'Technology', value: 150000, percentage: 46.9 },
            { sector: 'Healthcare', value: 100000, percentage: 31.25 },
            { sector: 'Finance', value: 70000, percentage: 21.875 }
          ]
        },
        {
          id: 'widget_3',
          type: 'table',
          title: 'Top Holdings',
          config: { type: 'table' },
          data: [
            { ticker: 'AAPL', shares: 100, price: 150, value: 15000, gain: 2000 },
            { ticker: 'MSFT', shares: 50, price: 300, value: 15000, gain: 3000 },
            { ticker: 'GOOGL', shares: 75, price: 140, value: 10500, gain: 1500 }
          ]
        },
        {
          id: 'widget_4',
          type: 'chart',
          title: 'Portfolio Performance',
          config: { type: 'bar' },
          data: [
            { holding: 'AAPL', gain_loss: 2000 },
            { holding: 'MSFT', gain_loss: 3000 },
            { holding: 'GOOGL', gain_loss: 1500 }
          ]
        }
      ],
      metrics: [
        { name: 'Total Value', value: 320000, unit: '$', category: 'profitability' },
        { name: 'Average Position', value: 80000, unit: '$', category: 'efficiency' },
        { name: 'Total Holdings', value: 3, unit: 'items', category: 'other' },
        { name: 'Portfolio Gain', value: 6500, unit: '$', category: 'profitability' }
      ],
      insights: [
        'Analyzed 3 holdings with total value of $320,000',
        'Portfolio showing strong performance with $6,500 total gains'
      ],
      summary: 'Calculated 4 metrics from 3 holdings'
    },
    timing: {
      totalExecutionTime: 450,
      queriesExecuted: 4,
      widgetsGenerated: 4,
      metricsComputed: 4
    }
  };
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/api/dashboard/generate' || req.url === '/') {
    res.writeHead(200);
    res.end(JSON.stringify(generateDashboard(), null, 2));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(8888, () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║    ✅ DASHBOARD API SERVER RUNNING ON PORT 5000           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
});
