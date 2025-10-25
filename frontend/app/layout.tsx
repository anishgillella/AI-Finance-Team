import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'AI Finance Agent - Dashboard',
  description: 'AI-powered financial analysis and insights',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <nav className="bg-slate-950 border-b border-slate-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">💰</span>
              </div>
              <h1 className="text-xl font-bold">AI Finance Agent</h1>
            </div>
            <div className="flex gap-6">
              <a href="/prompt-dashboard" className="hover:text-cyan-400 transition">Dashboard</a>
              <a href="/upload" className="hover:text-cyan-400 transition">Upload</a>
              <a href="/chat" className="hover:text-cyan-400 transition">Chat</a>
              <a href="/reports" className="hover:text-cyan-400 transition">Reports</a>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
