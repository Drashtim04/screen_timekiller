import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import FocusHoursChart from '../components/charts/FocusHoursChart';
import ProductivityHeatmap from '../components/charts/ProductivityHeatmap';
import DistractionsList from '../components/charts/DistractionsList';
import SessionHistoryTable from '../components/charts/SessionHistoryTable';
import UpgradeModal from '../components/UpgradeModal';
import PremiumFeature from '../components/PremiumFeature';
import ShareStatsModal from '../components/ShareStatsModal';
import EmergencyUnlocksBreakdown from '../components/charts/EmergencyUnlocksBreakdown';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../context/AuthContext';
import WeeklyReportsView from '../components/WeeklyReportsView';
import { Brain, Clock, Zap, Flame, ArrowRight } from 'lucide-react';
import { mockMetrics, mockWeeklyFocus, mockHeatmap, mockDistractions, mockSessions } from '../data/mockAnalytics';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showPricing, setShowPricing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const { handleUpgrade, isPro, renewalDate, cancelling, cancelSubscription, verifyPayment } = useSubscription();
  const openPricing = () => setShowPricing(true);
  const { session } = useAuth();

  // ── Handle redirect from Cashfree checkout ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order_id');
    const subId = params.get('subscription_id');
    const paymentStatus = params.get('payment_status');

    if (orderId && (paymentStatus === 'PAID' || paymentStatus === 'ACTIVE')) {
      verifyPayment(orderId).then((res) => {
        if (res?.upgraded) {
          console.log('[Dashboard] Payment verified and upgraded successfully.');
        }
        // Clear params from address bar
        window.history.replaceState(null, '', window.location.pathname);
      });
    } else if (subId) {
      // For subscriptions, check using subId as the orderId reference
      verifyPayment(subId).then((res) => {
        if (res?.upgraded) {
          console.log('[Dashboard] Subscription verified successfully.');
        }
        window.history.replaceState(null, '', window.location.pathname);
      });
    }
  }, [verifyPayment]);
  
  const [metrics, setMetrics] = useState(mockMetrics);
  const [weeklyFocus, setWeeklyFocus] = useState(mockWeeklyFocus);
  const [distractions, setDistractions] = useState(mockDistractions);
  const [heatmap, setHeatmap] = useState(mockHeatmap);
  const [sessions, setSessions] = useState(mockSessions);
  const [emergencyUnlocks, setEmergencyUnlocks] = useState({
    total: 8,
    reasons: {
      'Work Related': 3,
      'Quick Check': 2,
      'Habit': 2,
      'Bored': 1
    }
  });

  useEffect(() => {
    if (!session?.access_token) return;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    fetch(`${apiUrl}/api/analytics/overview`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        if (data.metrics) setMetrics(data.metrics);
        if (data.weeklyFocus && data.weeklyFocus.length > 0) setWeeklyFocus(data.weeklyFocus);
        if (data.topDistractions && data.topDistractions.length > 0) setDistractions(data.topDistractions);
        if (data.heatmapData && data.heatmapData.length > 0) setHeatmap(data.heatmapData);
        if (data.sessions && data.sessions.length > 0) setSessions(data.sessions);
        if (data.emergencyUnlocks) setEmergencyUnlocks(data.emergencyUnlocks);
      }
    })
    .catch(console.error);
  }, [session]);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex font-sans selection:bg-white/20">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onOpenPricing={() => setShowPricing(true)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
        <Header activeTab={activeTab} onShareClick={() => setShowShareModal(true)} />
        <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {activeTab === 'overview' && (
            <>
              <div className="bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 border border-blue-500/30 rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
                <div className="absolute -left-10 -top-10 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="space-y-2 relative z-10">
                  <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
                    <Brain className="w-4 h-4" />
                    <span>AI Productivity Operating System</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
                    Welcome back. Your focus is peaking.
                  </h2>
                  <p className="text-xs md:text-sm text-slate-400 max-w-xl leading-relaxed">
                    Our neural engine intercepted 42 distracting attempts today, preserving an estimated 2.1 hours of deep work flow state.
                  </p>
                </div>
                <button onClick={() => setShowPricing(true)} className="relative z-10 flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-black hover:bg-slate-200 font-bold text-xs transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95 shrink-0">
                  <span>View AI Coaching Report</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Daily Focus Score" value={`${metrics.dailyFocusScore}/100`} trend={metrics.focusScoreTrend} icon={Brain} subtitle="Top 12% among peer software engineers" iconColor="text-blue-400" />
                <StatCard title="Total Focus Hours" value={`${metrics.totalFocusHours}h`} trend={metrics.focusHoursTrend} icon={Clock} subtitle="Weekly cumulative deep work" iconColor="text-indigo-400" />
                <StatCard title="Focus Streak" value={`${metrics.currentStreak} Days`} icon={Flame} subtitle={`Personal record: ${metrics.bestStreak} days`} iconColor="text-orange-400" />
                <StatCard title="Deep Work Ratio" value={`${metrics.dailyFocusScore > 0 ? metrics.deepWorkPercentage : 0}%`} trend={metrics.deepWorkTrend} icon={Zap} subtitle="Percentage of highly efficient flow state" iconColor="text-green-400" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                <div className="lg:col-span-2">
                  <FocusHoursChart data={weeklyFocus} />
                </div>
                <div className="flex flex-col gap-8">
                  <DistractionsList data={distractions} />
                  <EmergencyUnlocksBreakdown data={emergencyUnlocks} />
                </div>
              </div>

              <div className="space-y-8">
                <PremiumFeature feature="Productivity Heatmap" overlay onUpgradeClick={openPricing}>
                  <ProductivityHeatmap data={heatmap} />
                </PremiumFeature>
              </div>
            </>
          )}

          {activeTab === 'focus' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">Focus Sessions Logs</h2>
                <p className="text-xs text-slate-400">Review historical productivity sessions and AI feedback</p>
              </div>
              <PremiumFeature feature="Session History" overlay onUpgradeClick={openPricing}>
                <SessionHistoryTable data={sessions} />
              </PremiumFeature>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">Advanced Focus Analytics</h2>
                <p className="text-xs text-slate-400">Deep-dive metrics on focus duration and streak histories</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                <div className="lg:col-span-2">
                  <FocusHoursChart data={weeklyFocus} />
                </div>
                <div>
                  <EmergencyUnlocksBreakdown data={emergencyUnlocks} />
                </div>
              </div>
              <PremiumFeature feature="Productivity Heatmap" overlay onUpgradeClick={openPricing}>
                <ProductivityHeatmap data={heatmap} />
              </PremiumFeature>
            </div>
          )}

          {activeTab === 'reports' && (
            <WeeklyReportsView />
          )}

          {activeTab === 'blocklist' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">Block List Management</h2>
                <p className="text-xs text-slate-400">Manage distracting websites and configure blocking levels</p>
              </div>
              <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-6 max-w-2xl">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                  <span className="text-sm font-semibold text-slate-200">Active Blocklist Rules</span>
                  <span className="text-xs text-slate-500 font-semibold">Synced with Extension</span>
                </div>
                <div className="space-y-3">
                  {[
                    { domain: 'twitter.com', category: 'Social Media', status: 'Blocked' },
                    { domain: 'youtube.com', category: 'Video Streaming', status: 'Blocked' },
                    { domain: 'reddit.com', category: 'Online Community', status: 'Blocked' }
                  ].map((site) => (
                    <div key={site.domain} className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:border-white/10 transition-all">
                      <div>
                        <span className="text-sm font-bold text-white block">{site.domain}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{site.category}</span>
                      </div>
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                        {site.status}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 italic mt-4 text-center">
                  Use your browser extension popup menu to append new domains and configure strict focus mode parameters.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">Account Settings</h2>
                <p className="text-xs text-slate-400">Manage your subscription, profile parameters, and theme preferences</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-white border-b border-white/[0.06] pb-2">Plan Details</h3>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Current Plan:</span>
                      <span className="font-bold text-blue-400 capitalize">{isPro ? 'Pro Subscription' : 'Free Plan'}</span>
                    </div>
                    {isPro && renewalDate && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Next Renewal:</span>
                        <span className="font-medium text-slate-200">{renewalDate.toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  {!isPro ? (
                    <button
                      onClick={() => setShowPricing(true)}
                      className="w-full mt-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all"
                    >
                      Upgrade to Premium
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        const success = await cancelSubscription();
                        if (success) alert('Subscription cancelled successfully.');
                      }}
                      disabled={cancelling}
                      className="w-full mt-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-xs rounded-xl transition-all"
                    >
                      {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                    </button>
                  )}
                </div>

                <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-4">
                  <h3 className="text-sm font-bold text-white border-b border-white/[0.06] pb-2">Preferences</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-200 font-semibold block">Email Notifications</span>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">Get weekly AI summaries sent directly to inbox</span>
                      </div>
                      <div className="w-8 h-4 bg-violet-600 rounded-full p-[2px] cursor-pointer">
                        <div className="w-3 h-3 bg-white rounded-full translate-x-4"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-200 font-semibold block">Strict Mode Blocking</span>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">Enforce strict blocker parameters on default sites</span>
                      </div>
                      <div className="w-8 h-4 bg-white/[0.1] rounded-full p-[2px] cursor-pointer">
                        <div className="w-3 h-3 bg-white rounded-full translate-x-0"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showPricing && <UpgradeModal onClose={() => setShowPricing(false)} source="dashboard" />}
          {showShareModal && <ShareStatsModal onClose={() => setShowShareModal(false)} />}

        </main>
      </div>
    </div>
  );
}
