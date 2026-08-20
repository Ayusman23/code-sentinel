import React, { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import { TriagePipeline } from './components/dashboard/TriagePipeline';
import { MetricsGrid } from './components/dashboard/MetricsGrid';
import { LiveLogFeed } from './components/dashboard/LiveLogFeed';
import { PRReviewList } from './components/reviews/PRReviewList';
import { ManualDiffPlayground } from './components/sandbox/ManualDiffPlayground';
import { GitHubPRSimulator } from './components/github/GitHubPRSimulator';
import { AuditMatrix } from './components/audit/AuditMatrix';
import { getMetrics, getReviews } from './services/api';
import { useSocket } from './context/SocketContext';

export function App() {
  const [activeTab, setActiveTab] = useState('command-center');
  const [metrics, setMetrics] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const { triageEvents } = useSocket();

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, r] = await Promise.all([
        getMetrics().catch(() => null),
        getReviews().catch(() => ({ data: [] }))
      ]);
      if (m) setMetrics(m);
      if (r?.data) setReviews(r.data);
    } catch (e) {
      console.log('API load data offline:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reload reviews when a PR triage completes via Socket
  useEffect(() => {
    if (triageEvents.length > 0 && triageEvents[0].stage === 'COMPLETED') {
      loadData();
    }
  }, [triageEvents]);

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text flex flex-col selection:bg-cyber-accent selection:text-cyber-dark">
      {/* Background Cyber Glow */}
      <div className="fixed inset-0 bg-cyber-gradient pointer-events-none" />
      <div className="fixed inset-0 bg-grid-pattern opacity-15 pointer-events-none" />

      {/* Top Cyber Navigation */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Viewport Content */}
      <main className="max-w-7xl w-full mx-auto p-6 space-y-6 flex-1 relative z-10">
        
        {/* Real-Time Triage HUD (Always visible on Command Center and PR views) */}
        {(activeTab === 'command-center' || activeTab === 'pr-reviews') && (
          <TriagePipeline />
        )}

        {/* Tab 1: Command Center Overview */}
        {activeTab === 'command-center' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <MetricsGrid metrics={metrics} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                    Recent PR Triage Stream ({reviews.length})
                  </h3>
                  <button
                    onClick={() => setActiveTab('pr-reviews')}
                    className="text-xs font-mono text-cyber-accent hover:underline"
                  >
                    View All Reviews →
                  </button>
                </div>
                <PRReviewList reviews={reviews.slice(0, 5)} loading={loading} onRefresh={loadData} />
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Audit Telemetry
                </h3>
                <LiveLogFeed />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: PR Reviews Triage Matrix */}
        {activeTab === 'pr-reviews' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <PRReviewList reviews={reviews} loading={loading} onRefresh={loadData} />
          </div>
        )}

        {/* Tab 3: Manual Diff Sandbox */}
        {activeTab === 'diff-sandbox' && (
          <div className="animate-in fade-in duration-200">
            <ManualDiffPlayground />
          </div>
        )}

        {/* Tab 4: GitHub PR Webhook Simulator */}
        {activeTab === 'github-simulator' && (
          <div className="animate-in fade-in duration-200">
            <GitHubPRSimulator onReviewComplete={loadData} />
          </div>
        )}

        {/* Tab 5: Compliance Audit Logs */}
        {activeTab === 'audit-logs' && (
          <div className="animate-in fade-in duration-200">
            <AuditMatrix />
          </div>
        )}

      </main>

      {/* Cyber Footer */}
      <footer className="border-t border-cyber-border/20 py-4 px-6 text-center text-xs font-mono text-cyber-muted relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CodeSentinel Enterprise AI DevSecOps Agent • GitHub PR Reviewer</span>
          <span>Dual Runtime: Node.js Control Plane + Python FastAPI Worker Plane + Gemini API</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
