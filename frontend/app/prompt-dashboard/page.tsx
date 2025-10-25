'use client';

import { useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface Widget {
  id: string;
  type: 'kpi' | 'chart' | 'table';
  title: string;
  data: any[];
  config?: any;
  visualization_type?: string;
}

interface DashboardData {
  id: string;
  type: string;
  title: string;
  description: string;
  widgets: Widget[];
  metrics?: Array<{ name: string; value: number | string; unit: string }>;
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

const EXAMPLE_PROMPTS = [
  'Show me my top 5 holdings',
  'How much did I spend last month by category?',
  'Show me my budget status',
  'Show my portfolio performance over the last 6 months',
  'What are my financial goals and how am I doing?'
];

function KPICard({ metric }: { metric: any }) {
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
  const { title, data, config, visualization_type } = widget;

  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-300 mb-4">{title}</h3>
        <div className="text-slate-500 text-center py-8">No data available</div>
      </div>
    );
  }

  const chartType = config?.type || visualization_type || 'bar';

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-slate-300 mb-4">{title}</h3>

      {(chartType === 'kpi' || widget.type === 'kpi') && (
        <div className="text-4xl font-bold text-cyan-400 text-center py-8">
          {config?.value || data[0]?.value}
        </div>
      )}

      {chartType === 'pie' && (
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

      {(chartType === 'bar' || (!chartType && widget.type === 'chart')) && (
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

      {chartType === 'line' && (
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

      {(chartType === 'table' || widget.type === 'table') && (
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

export default function PromptDashboardPage() {
  const [prompt, setPrompt] = useState('');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timing, setTiming] = useState<any>(null);
  const [showExamples, setShowExamples] = useState(true);

  async function generateDashboard() {
    if (!prompt.trim()) {
      setError('Please enter a dashboard description');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setShowExamples(false);

      const response = await fetch('http://localhost:8888/api/dashboard/from-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result: ApiResponse = await response.json();

      if (result.success && result.data) {
        setDashboard(result.data);
        setTiming(result.timing);
      } else {
        setError('Failed to generate dashboard');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Error: ${errorMsg}. Make sure the backend is running on port 8888`);
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }

  function selectExample(examplePrompt: string) {
    setPrompt(examplePrompt);
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateDashboard();
    }
  };

  return (
    <div className="min-h-screen space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Financial Dashboard
          </h1>
          <p className="text-slate-400">Describe what you want to see in natural language</p>
        </div>
      </div>

      {/* Prompt Input */}
      {!dashboard || showExamples ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., Show me my top 5 holdings with their gains"
              className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={generateDashboard}
              disabled={loading}
              className="px-8 py-2 bg-cyan-500 text-slate-900 rounded font-bold hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Generating...' : 'Generate Dashboard'}
            </button>
            {dashboard && (
              <button
                onClick={() => {
                  setDashboard(null);
                  setPrompt('');
                  setShowExamples(true);
                }}
                className="px-8 py-2 bg-slate-700 text-slate-300 rounded font-bold hover:bg-slate-600 transition"
              >
                Start Over
              </button>
            )}
          </div>

          {/* Example Prompts */}
          {showExamples && (
            <div className="space-y-2">
              <p className="text-sm text-slate-400">💡 Or try one of these examples:</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map((example) => (
                  <button
                    key={example}
                    onClick={() => selectExample(example)}
                    className="px-3 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-slate-300 hover:border-cyan-400 hover:text-cyan-400 transition"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-300">
              <h3 className="font-semibold mb-1">⚠️ Error</h3>
              <p>{error}</p>
            </div>
          )}
        </div>
      ) : null}

      {/* Dashboard Display */}
      {dashboard && (
        <div className="space-y-8">
          {/* Dashboard Info */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">{dashboard.title}</h2>
            <p className="text-slate-400">{dashboard.description}</p>
            <p className="text-xs text-slate-500">
              ⏱️ Generated in {timing?.totalExecutionTime}ms • {timing?.queriesExecuted} queries • {timing?.widgetsGenerated} widgets
            </p>
          </div>

          {/* Metrics Row */}
          {dashboard.metrics && dashboard.metrics.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {dashboard.metrics.map((metric, idx) => (
                <KPICard key={idx} metric={metric} />
              ))}
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

          {/* New Dashboard Button */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setDashboard(null);
                setPrompt('');
                setShowExamples(true);
              }}
              className="px-6 py-2 bg-slate-700 text-slate-300 rounded font-bold hover:bg-slate-600 transition"
            >
              ← Create Another Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="animate-spin">
            <div className="w-12 h-12 border-4 border-slate-700 border-t-cyan-400 rounded-full"></div>
          </div>
          <p className="text-slate-400">Generating your dashboard...</p>
          <p className="text-sm text-slate-500">This may take a few seconds</p>
        </div>
      )}
    </div>
  );
}
