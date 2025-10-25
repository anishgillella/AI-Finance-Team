'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface Widget {
  id: string;
  type: 'kpi' | 'chart' | 'table';
  title: string;
  data: any[];
  config?: any;
}

interface Metric {
  name: string;
  value: number | string;
  unit: string;
  category?: string;
}

interface DashboardData {
  id: string;
  type: string;
  title: string;
  description: string;
  widgets: Widget[];
  metrics: Metric[];
  insights?: string[];
  summary?: string;
}

interface ApiResponse {
  success: boolean;
  data: DashboardData;
  timing: {
    totalExecutionTime: number;
    queriesExecuted: number;
    widgetsGenerated: number;
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function KPICard({ metric }: { metric: Metric }) {
  const getColorClass = () => {
    if (typeof metric.value === 'number' && metric.value > 0) return 'text-green-500';
    if (typeof metric.value === 'number' && metric.value < 0) return 'text-red-500';
    return 'text-blue-500';
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-cyan-400 transition">
      <h3 className="text-sm font-medium text-slate-400">{metric.name}</h3>
      <p className={`text-3xl font-bold mt-2 ${getColorClass()}`}>
        {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
        <span className="text-lg ml-2 text-slate-400">{metric.unit}</span>
      </p>
    </div>
  );
}

function ChartWidget({ widget }: { widget: Widget }) {
  const { title, data, config } = widget;

  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-300 mb-4">{title}</h3>
        <div className="text-slate-500 text-center py-8">No data available</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-slate-300 mb-4">{title}</h3>

      {config?.type === 'kpi' && (
        <div className="text-4xl font-bold text-cyan-400 text-center py-8">
          {config.value} {config.unit}
        </div>
      )}

      {config?.type === 'pie' && (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey={Object.keys(data[0])?.[1] || 'value'}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )}

      {config?.type === 'bar' && (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey={Object.keys(data[0])?.[0] || 'name'} stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
            <Legend />
            <Bar dataKey={Object.keys(data[0])?.[1] || 'value'} fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      )}

      {config?.type === 'line' && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey={Object.keys(data[0])?.[0] || 'name'} stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
            <Legend />
            <Line
              type="monotone"
              dataKey={Object.keys(data[0])?.[1] || 'value'}
              stroke="#10b981"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {config?.type === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-600">
                {Object.keys(data[0]).map((key) => (
                  <th key={key} className="px-4 py-2 text-left font-semibold text-slate-300">
                    {key.replace(/_/g, ' ').toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 10).map((row, idx) => (
                <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700/30 transition">
                  {Object.values(row).map((val, cidx) => (
                    <td key={cidx} className="px-4 py-2 text-slate-300">
                      {typeof val === 'number' ? val.toLocaleString() : String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardType, setDashboardType] = useState('PORTFOLIO');
  const [timing, setTiming] = useState<any>(null);

  useEffect(() => {
    loadDashboard(dashboardType);
  }, [dashboardType]);

  async function loadDashboard(type: string) {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:8888/api/dashboard/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result: ApiResponse = await response.json();

      if (result.success && result.data) {
        setDashboard(result.data);
        setTiming(result.timing);
      } else {
        setError('Failed to load dashboard');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Connection error: ${errorMsg}. Make sure backend is running on port 5000`);
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }

  const dashboardTypes = [
    { value: 'PORTFOLIO', label: '📊 Portfolio' },
    { value: 'TRANSACTIONS', label: '💳 Transactions' },
    { value: 'BUDGETS', label: '💰 Budgets' },
    { value: 'FINANCIAL_GOALS', label: '🎯 Financial Goals' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-cyan-400 rounded-full"></div>
        </div>
        <p className="text-slate-400">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 text-red-300">
          <h2 className="text-lg font-semibold mb-2">⚠️ Error Loading Dashboard</h2>
          <p>{error}</p>
          <p className="text-sm mt-4 text-red-200">
            Make sure the backend server is running with: <code className="bg-red-950 px-2 py-1 rounded">npm run dev</code>
          </p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return <div className="text-slate-400">No dashboard data</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header with Controls */}
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            {dashboard.title}
          </h1>
          <p className="text-slate-400">{dashboard.description}</p>
        </div>

        {/* Dashboard Selector */}
        <div className="flex gap-2 flex-wrap">
          {dashboardTypes.map((dt) => (
            <button
              key={dt.value}
              onClick={() => setDashboardType(dt.value)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                dashboardType === dt.value
                  ? 'bg-cyan-500 text-slate-900'
                  : 'bg-slate-800/50 border border-slate-700 text-slate-300 hover:border-cyan-400'
              }`}
            >
              {dt.label}
            </button>
          ))}
        </div>

        {/* Metrics */}
        <p className="text-sm text-slate-500">
          ⏱️ Generated in {timing?.totalExecutionTime}ms • {timing?.queriesExecuted} queries • {timing?.widgetsGenerated} widgets
        </p>
      </div>

      {/* KPI Cards */}
      {dashboard.metrics && dashboard.metrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboard.metrics.map((metric, idx) => (
            <KPICard key={idx} metric={metric} />
          ))}
        </div>
      )}

      {/* Insights */}
      {dashboard.insights && dashboard.insights.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-300 mb-4">💡 Insights</h3>
          <ul className="space-y-2">
            {dashboard.insights.map((insight, idx) => (
              <li key={idx} className="text-slate-400 flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Widgets Grid */}
      {dashboard.widgets && dashboard.widgets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dashboard.widgets.map((widget) => (
            <ChartWidget key={widget.id} widget={widget} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-slate-700 pt-6 text-sm text-slate-500">
        <p>Dashboard ID: <code className="bg-slate-800/50 px-2 py-1 rounded">{dashboard.id}</code></p>
        {dashboard.summary && <p className="mt-2">Summary: {dashboard.summary}</p>}
      </div>
    </div>
  );
}
