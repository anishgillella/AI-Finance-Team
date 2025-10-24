'use client';

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          AI Finance Agent
        </h1>
        <p className="text-xl text-slate-300 mb-8">
          Upload your financial data. Get AI-powered insights instantly.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/upload"
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition"
          >
            Upload CSV
          </a>
          <a
            href="/dashboard"
            className="px-8 py-3 border border-cyan-400 text-cyan-400 rounded-lg font-semibold hover:bg-cyan-400 hover:text-slate-900 transition"
          >
            View Dashboard
          </a>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard
          icon="📊"
          title="Financial Analytics"
          description="Calculate KPIs, profit margins, and expense breakdowns automatically"
        />
        <FeatureCard
          icon="🤖"
          title="AI Insights"
          description="Get intelligent analysis and recommendations powered by GPT-4o"
        />
        <FeatureCard
          icon="🔍"
          title="Anomaly Detection"
          description="Detect unusual transactions and patterns in your financial data"
        />
      </div>

      {/* Stats Section */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 grid grid-cols-3 gap-8">
        <StatBox label="Transactions" value="∞" />
        <StatBox label="Accuracy" value="81%" />
        <StatBox label="Models" value="GPT-4o" />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-cyan-400 transition">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-cyan-400 mb-2">{value}</div>
      <div className="text-slate-400">{label}</div>
    </div>
  );
}
