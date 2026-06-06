import { useEffect, useState } from "react";
import { Brain, Shield, Plus, X, Clock, Play, Square, Pause, History, AlertTriangle, CheckCircle2, Lock, LayoutDashboard, Zap, Sparkles, Loader2 } from "lucide-react";
import { Storage } from "./storage";
import { BlockingState, BlockRule } from "./types/blocking";
import { usePomodoroStore } from "./store/usePomodoroStore";
import { useTimer } from "./hooks/useTimer";
import "./style.css";

const FREE_SITE_LIMIT = 3;

export default function IndexPopup() {
  const [blockingState, setBlockingState] = useState<BlockingState | null>(null);
  const [isPro, setIsPro] = useState(false);
  const pomodoro = usePomodoroStore();
  const [activeTab, setActiveTab] = useState<'timer' | 'blocklist' | 'dashboard' | 'history'>('timer');
  const [newUrl, setNewUrl] = useState("");
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [goalText, setGoalText] = useState("");
  const [dashboardData, setDashboardData] = useState<{
    dailyFocusScore: number;
    totalFocusHours: number;
    deepWorkPercentage: number;
    totalDistractions: number;
  } | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  const timeLeft = useTimer(pomodoro.endTime, pomodoro.status, pomodoro.pausedAt, pomodoro.duration);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  useEffect(() => {
    Storage.getState().then(setBlockingState);
    Storage.onChange((changes) => {
      setBlockingState(prev => prev ? { ...prev, ...changes } : null);
    });

    // Read isPro from chrome.storage (synced from dashboard via SYNC_AUTH message).
    chrome.storage.local.get(['isPro'], ({ isPro: pro }) => {
      setIsPro(!!pro);
    });

    // Live-update isPro if the dashboard syncs a new subscription state while the popup is open.
    // This handles the case where the user upgrades to Pro in the dashboard tab
    // and then switches back to the extension — the free-plan limit should lift immediately.
    const onStorageChanged = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) => {
      if (area === 'local' && 'isPro' in changes) {
        setIsPro(!!changes.isPro.newValue);
      }
    };
    chrome.storage.onChanged.addListener(onStorageChanged);
    return () => chrome.storage.onChanged.removeListener(onStorageChanged);
  }, []);

  // Fetch mini dashboard metrics on tab open
  useEffect(() => {
    if (activeTab !== 'dashboard') return;
    
    setLoadingDashboard(true);
    chrome.storage.local.get(['accessToken']).then(({ accessToken }) => {
      // Mock for user-1 or missing token
      if (!accessToken) {
        setDashboardData({
          dailyFocusScore: 88,
          totalFocusHours: 3.4,
          deepWorkPercentage: 76,
          totalDistractions: 12
        });
        setLoadingDashboard(false);
        return;
      }

      fetch('http://localhost:3001/api/analytics/overview', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.metrics) {
          const distractionsCount = data.topDistractions?.reduce((acc: number, d: any) => acc + (d.attempts || 0), 0) || 0;
          setDashboardData({
            dailyFocusScore: data.metrics.dailyFocusScore || 0,
            totalFocusHours: data.metrics.totalFocusHours || 0,
            deepWorkPercentage: data.metrics.deepWorkPercentage || 0,
            totalDistractions: distractionsCount
          });
        }
      })
      .catch(err => {
        console.error(err);
        setDashboardData({
          dailyFocusScore: 82,
          totalFocusHours: 3.1,
          deepWorkPercentage: 75,
          totalDistractions: 4
        });
      })
      .finally(() => {
        setLoadingDashboard(false);
      });
    });
  }, [activeTab]);

  if (!blockingState) return <div className="w-[380px] h-[550px] bg-[#0A0A0B] text-[#EDEDED] flex items-center justify-center">Loading...</div>;

  const addBlockRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;

    // Enforce free plan 3-site limit
    if (!isPro && blockingState && blockingState.blocklist.length >= FREE_SITE_LIMIT) return;

    let domain = newUrl.trim().toLowerCase();
    if (domain.startsWith('http')) {
      try { domain = new URL(domain).hostname; } catch(e) {}
    }
    if (!domain.startsWith('*.')) domain = '*.' + domain.replace(/^www\./, '');
    const newRule: BlockRule = { id: crypto.randomUUID(), domain };
    Storage.setState({ blocklist: [...blockingState!.blocklist, newRule] });
    setNewUrl("");
  };

  const removeBlockRule = (id: string) => {
    Storage.setState({ blocklist: blockingState.blocklist.filter(r => r.id !== id) });
  };

  return (
    <div className="w-[380px] h-[550px] bg-[#0A0A0B] text-[#EDEDED] font-sans flex flex-col selection:bg-white/20">
      {/* Linear-inspired Navbar */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.08] bg-[#0A0A0B]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-[4px] bg-white text-black flex items-center justify-center">
            <Brain className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-[13px] tracking-tight">DeepWork Mode</span>
        </div>
        <div className="flex gap-1 bg-white/[0.04] p-0.5 rounded-md border border-white/[0.05]">
          <NavButton active={activeTab === 'timer'} onClick={() => setActiveTab('timer')} icon={<Clock className="w-3.5 h-3.5" />} />
          <NavButton active={activeTab === 'blocklist'} onClick={() => setActiveTab('blocklist')} icon={<Shield className="w-3.5 h-3.5" />} />
          <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard className="w-3.5 h-3.5" />} />
          <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History className="w-3.5 h-3.5" />} />
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        {activeTab === 'timer' && showGoalInput && (
          <div className="space-y-5 flex flex-col items-center pt-6 w-full max-w-[320px] mx-auto animate-in fade-in duration-200">
            <div className="text-center space-y-1.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-2">
                <Brain className="w-5 h-5 animate-pulse" />
              </div>
              <h2 className="text-[15px] font-semibold text-white">What are you working on?</h2>
              <p className="text-[11px] text-white/40 font-medium">Select a prompt or write a custom goal</p>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full">
              {["Flutter Project", "Study Session", "Startup Work", "Writing"].map(g => (
                <button
                  key={g}
                  onClick={() => {
                    pomodoro.start(g);
                    setShowGoalInput(false);
                    setGoalText("");
                  }}
                  className="py-2.5 px-3 bg-white/[0.02] hover:bg-white/[0.06] active:bg-white/[0.03] border border-white/[0.05] rounded-xl text-[12px] text-white/80 hover:text-white font-medium transition-all text-center"
                >
                  {g}
                </button>
              ))}
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const finalGoal = goalText.trim() || "Focus Session";
                pomodoro.start(finalGoal);
                setShowGoalInput(false);
                setGoalText("");
              }}
              className="w-full space-y-3 pt-2"
            >
              <input
                type="text"
                value={goalText}
                onChange={e => setGoalText(e.target.value)}
                placeholder="Or type custom goal..."
                className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-3 py-2.5 text-[12px] text-white focus:outline-none focus:border-white/20 transition-colors placeholder:text-white/30"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowGoalInput(false);
                    setGoalText("");
                  }}
                  className="flex-1 h-10 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.05] rounded-xl text-[12px] text-white/70 hover:text-white font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 bg-white text-black hover:bg-white/90 rounded-xl text-[12px] font-semibold transition-all shadow-sm"
                >
                  Start Focus
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'timer' && !showGoalInput && (
          <div className="space-y-6 flex flex-col items-center pt-4">
            
            {/* Mode Selector */}
            <div className="flex gap-1 bg-white/[0.04] p-1 rounded-full border border-white/[0.05]">
              {(['pomodoro', 'shortBreak', 'longBreak'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => pomodoro.status === 'idle' && pomodoro.setMode(m)}
                  disabled={pomodoro.status !== 'idle'}
                  className={`px-3 py-1.5 text-[12px] font-medium rounded-full transition-all ${
                    pomodoro.mode === m 
                      ? 'bg-white/[0.12] text-white shadow-sm' 
                      : 'text-white/50 hover:text-white/80'
                  } ${pomodoro.status !== 'idle' ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  {m === 'pomodoro' ? 'Focus' : m === 'shortBreak' ? 'Short Break' : 'Long Break'}
                </button>
              ))}
            </div>

            {/* Timer Display */}
            <div className="relative flex flex-col items-center py-6 w-full">
              {/* Subtle ambient glow behind timer if running */}
              {pomodoro.status === 'running' && pomodoro.mode === 'pomodoro' && (
                <div className="absolute inset-0 bg-white/[0.03] blur-3xl rounded-full"></div>
              )}
              
              <div className={`relative z-10 text-[72px] leading-none font-semibold tracking-tighter tabular-nums transition-colors duration-700 ${
                pomodoro.mode === 'pomodoro' && pomodoro.status === 'running' ? 'text-white' : 'text-white/70'
              }`}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
              <p className="text-[13px] text-white/40 mt-3 font-medium flex items-center gap-1.5">
                {pomodoro.status === 'running' ? (
                  <><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> In Deep Work</>
                ) : pomodoro.status === 'paused' ? (
                  <><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Paused</>
                ) : 'Ready to focus'}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 w-full max-w-[260px]">
              {pomodoro.status === 'running' ? (
                <button onClick={pomodoro.pause} className="flex-1 h-11 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] rounded-[10px] flex items-center justify-center transition-all shadow-sm">
                  <Pause className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={() => {
                    if (pomodoro.mode === 'pomodoro' && pomodoro.status === 'idle') {
                      setShowGoalInput(true);
                    } else {
                      pomodoro.start();
                    }
                  }} 
                  className="flex-1 h-11 bg-white text-black hover:bg-white/90 rounded-[10px] flex items-center justify-center font-semibold text-[13px] transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-[0.98]"
                >
                  {pomodoro.status === 'paused' ? 'Resume' : 'Start Timer'}
                </button>
              )}
              
              <button 
                onClick={pomodoro.reset}
                disabled={pomodoro.status === 'idle'}
                className="w-11 h-11 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.05] rounded-[10px] flex items-center justify-center transition-all disabled:opacity-30 active:scale-[0.98]"
              >
                <Square className="w-4 h-4 text-white/70" />
              </button>
            </div>

            {/* Options */}
            <div className="w-full space-y-2 mt-4">
              {/* Strict Mode Toggle */}
              <div className="w-full p-3.5 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-colors" onClick={pomodoro.toggleStrictMode}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${pomodoro.strictMode ? 'bg-orange-500/10 text-orange-400' : 'bg-white/[0.05] text-white/40'}`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-medium text-white/90">Strict Mode</span>
                    <span className="text-[11px] text-white/40">Whitelist-only browsing</span>
                  </div>
                </div>
                <div className={`w-8 h-4 rounded-full p-[2px] transition-colors duration-300 ${pomodoro.strictMode ? 'bg-orange-500' : 'bg-white/[0.1]'}`}>
                  <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-300 ${pomodoro.strictMode ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>
              
              {/* Streak Stats */}
              <div className="w-full p-3.5 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-medium text-white/90">Current Streak</span>
                    <span className="text-[11px] text-white/40">{pomodoro.sessionCount} sessions total</span>
                  </div>
                </div>
                <div className="text-[13px] font-semibold text-white/90">
                  {pomodoro.streakDays} {pomodoro.streakDays === 1 ? 'day' : 'days'}
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'blocklist' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-[13px] text-white/60">Sites blocked during Deep Work</div>
              {!isPro && (
                <span className="text-[10px] text-slate-500 font-medium">
                  {blockingState.blocklist.length}/{FREE_SITE_LIMIT} sites
                </span>
              )}
            </div>

            {/* Upgrade notice for free users at limit */}
            {!isPro && blockingState.blocklist.length >= FREE_SITE_LIMIT && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Lock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-blue-300 font-semibold">Free plan limit reached</p>
                  <p className="text-[10px] text-slate-500">Upgrade to Pro for unlimited blocking</p>
                </div>
              </div>
            )}

            <form onSubmit={addBlockRule} className="flex gap-2">
              <input
                type="text"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="e.g. reddit.com"
                disabled={!isPro && blockingState.blocklist.length >= FREE_SITE_LIMIT}
                className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-[8px] px-3 py-2 text-[13px] text-white focus:outline-none focus:border-white/20 transition-colors placeholder:text-white/30 disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!isPro && blockingState.blocklist.length >= FREE_SITE_LIMIT}
                className="bg-white text-black hover:bg-white/90 p-2 px-3 rounded-[8px] transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            <div className="space-y-1.5 mt-4">
              {blockingState.blocklist.length === 0 ? (
                <div className="text-center text-white/40 py-8 text-[13px]">
                  No blocked websites yet.
                </div>
              ) : (
                blockingState.blocklist.map(rule => (
                  <div key={rule.id} className="flex items-center justify-between bg-white/[0.02] p-2.5 px-3 rounded-[8px] border border-white/[0.04] group hover:border-white/[0.1] transition-colors">
                    <span className="text-[13px] font-medium text-white/70 truncate pr-4">{rule.domain}</span>
                    <button 
                      onClick={() => removeBlockRule(rule.id)}
                      className="text-white/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      {activeTab === 'dashboard' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="text-[13px] text-white/60">Today's Focus Dashboard</div>
          </div>
          
          {loadingDashboard ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
              <span className="text-[11px] text-white/30">Loading metrics...</span>
            </div>
          ) : dashboardData ? (
            <div className="space-y-3">
              {/* Score Widget */}
              <div className="p-4 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-violet-400 tracking-wider flex items-center gap-1">
                    <Brain className="w-3.5 h-3.5 animate-pulse" /> Focus Intensity
                  </span>
                  <h3 className="text-sm font-bold text-white leading-none">Focus Score</h3>
                  <p className="text-[10px] text-white/40">Efficiency rating today</p>
                </div>
                <div className="w-12 h-12 rounded-full border-2 border-violet-500/30 flex items-center justify-center relative">
                  <div className="absolute inset-0.5 rounded-full border border-violet-500 flex items-center justify-center">
                    <span className="text-xs font-black text-white">{dashboardData.dailyFocusScore}</span>
                  </div>
                </div>
              </div>

              {/* Grid metrics */}
              <div className="grid grid-cols-2 gap-3">
                {/* Focus hours */}
                <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-center space-y-1">
                  <span className="text-[10px] text-white/40 block font-medium">Focus Time</span>
                  <span className="text-xs font-bold text-white block flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-400" /> {dashboardData.totalFocusHours}h
                  </span>
                </div>

                {/* Flow Ratio */}
                <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-center space-y-1">
                  <span className="text-[10px] text-white/40 block font-medium">Deep Work</span>
                  <span className="text-xs font-bold text-green-400 block flex items-center justify-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> {dashboardData.deepWorkPercentage}%
                  </span>
                </div>
              </div>

              {/* Distractions block */}
              <div className="p-3.5 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-medium text-white/90">Distractions Avoided</span>
                    <span className="text-[10px] text-white/40">Focus leaks prevented today</span>
                  </div>
                </div>
                <div className="text-xs font-bold text-orange-400">
                  {dashboardData.totalDistractions} blocks
                </div>
              </div>

              {/* Redirect button to web app */}
              <button
                onClick={() => chrome.tabs.create({ url: 'http://localhost:5173/dashboard' })}
                className="w-full py-2.5 bg-white text-black hover:bg-slate-200 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-md shadow-white/5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Open Web Dashboard
              </button>
            </div>
          ) : null}
        </div>
      )}

        {activeTab === 'history' && (() => {
          const emergencyUnlocks = blockingState.emergencyUnlocks || [];
          const totalUnlocks = emergencyUnlocks.length;
          const reasonCounts = emergencyUnlocks.reduce((acc, curr) => {
            if (curr.reason) {
              acc[curr.reason] = (acc[curr.reason] || 0) + 1;
            }
            return acc;
          }, { 'Work Related': 0, 'Quick Check': 0, 'Habit': 0, 'Bored': 0 } as Record<string, number>);

          return (
            <div className="space-y-4">
              <div>
                <div className="text-[13px] text-white/60 mb-2">Recent Sessions</div>
                {pomodoro.history.length === 0 ? (
                  <div className="text-center text-white/40 py-8 text-[13px]">
                    No sessions completed yet.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {pomodoro.history.map(log => (
                      <div key={log.id} className="flex items-center justify-between bg-white/[0.02] p-2.5 px-3 rounded-[8px] border border-white/[0.04]">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${log.mode === 'pomodoro' ? 'bg-blue-400' : 'bg-green-400'}`} />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[13px] font-medium text-white/80 truncate">
                              {log.goal ? log.goal : (log.mode === 'pomodoro' ? 'Focus Session' : 'Break')}
                            </span>
                            {log.goal && <span className="text-[10px] text-white/30 capitalize">{log.mode}</span>}
                          </div>
                        </div>
                        <span className="text-[12px] text-white/40 shrink-0 ml-2">
                          {Math.floor(log.duration / 60)} min
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Emergency Unlocks Section */}
              <div className="pt-4 border-t border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] text-white/60">Emergency Unlocks</div>
                  <span className="text-[10px] text-slate-500 font-semibold">{totalUnlocks} total</span>
                </div>
                {totalUnlocks === 0 ? (
                  <div className="text-center text-white/40 py-6 text-[13px]">
                    No emergency unlocks recorded.
                  </div>
                ) : (
                  <div className="space-y-2 bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl">
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.entries(reasonCounts) as [string, number][]).map(([reason, count]) => {
                        const percentage = totalUnlocks > 0 ? (count / totalUnlocks) * 100 : 0;
                        return (
                          <div key={reason} className="p-2.5 bg-white/[0.02] border border-white/[0.03] rounded-lg space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                              <span>{reason}</span>
                              <span className="text-white/80 font-bold">{count}</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden border border-white/[0.02]">
                              <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon }: { active: boolean, onClick: () => void, icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`p-1.5 rounded-[4px] transition-all ${active ? 'bg-white/[0.12] text-white shadow-sm' : 'text-white/40 hover:text-white/80 hover:bg-white/[0.05]'}`}
    >
      {icon}
    </button>
  );
}
