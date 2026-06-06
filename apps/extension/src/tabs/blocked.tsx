import { useEffect, useState } from "react";
import { Shield, Clock, AlertTriangle, ArrowLeft } from "lucide-react";
import { Storage } from "../storage";
import FocusCoachCard, { logCoachEvent } from "../components/FocusCoachCard";
import FocusCoachModal from "../components/FocusCoachModal";
import "../style.css";

/**
 * The custom redirect page shown when a website is blocked.
 * Features an emergency temporary unlock system with cooldowns.
 */
export default function BlockedPage() {
  const [url, setUrl] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [coachingMsg, setCoachingMsg] = useState("");
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentGoal, setCurrentGoal] = useState<string | null>(null);

  useEffect(() => {
    // Extract original URL from query params
    const params = new URLSearchParams(window.location.search);
    setUrl(params.get("url") || "");

    // Check emergency unlock cooldown status
    Storage.getState().then(state => {
      if (state.emergencyCooldownUntil) {
        const remaining = Math.max(0, Math.floor((state.emergencyCooldownUntil - Date.now()) / 1000));
        setCooldown(remaining);
      }
    });

    // Update cooldown timer every second
    const timer = setInterval(() => {
      setCooldown(c => Math.max(0, c - 1));
    }, 1000);

    // Read isPro and check pomodoroState for Coach Modal trigger
    chrome.storage.local.get(['isPro', 'pomodoroState', 'lastCoachedSessionStartTime']).then(({ isPro: pro, pomodoroState, lastCoachedSessionStartTime }) => {
      setIsPro(!!pro);
      
      if (pomodoroState && pomodoroState.status === 'running' && pomodoroState.mode === 'pomodoro') {
        if (pomodoroState.currentGoal) {
          setCurrentGoal(pomodoroState.currentGoal);
        }
        
        if (pomodoroState.startTime && lastCoachedSessionStartTime !== pomodoroState.startTime) {
          setShowCoachModal(true);
          chrome.storage.local.set({ lastCoachedSessionStartTime: pomodoroState.startTime });
        }
      }
    });

    return () => clearInterval(timer);
  }, []);

  const handleTemporaryUnlock = async () => {
    if (cooldown > 0) return;
    setShowSurvey(true);
  };

  const handleCloseTab = async () => {
    if (isPro && coachingMsg) {
      await logCoachEvent(url, coachingMsg, 'Returned to Work');
    }
    window.close();
  };

  const submitUnlockReason = async (reason: 'Work Related' | 'Quick Check' | 'Habit' | 'Bored') => {
    if (cooldown > 0 || submitting) return;
    setSubmitting(true);
    
    // Unlock for 5 minutes
    const unlockTime = Date.now() + 5 * 60 * 1000;
    // Set a cooldown for 30 minutes before next unlock is allowed
    const cooldownTime = Date.now() + 30 * 60 * 1000;
    
    // Extract domain to store
    let domainStr = url;
    try { domainStr = new URL(url).hostname; } catch (e) {}

    // Log Coach Event if Pro
    if (isPro && coachingMsg) {
      await logCoachEvent(url, coachingMsg, 'Unlocked');
    }

    // 1. Store locally in Storage
    try {
      const state = await Storage.getState();
      const newUnlock = {
        id: crypto.randomUUID(),
        domain: domainStr,
        reason,
        timestamp: Date.now()
      };
      const newUnlocks = [...(state.emergencyUnlocks || []), newUnlock];
      
      await Storage.setState({ 
        temporaryUnlockUntil: unlockTime,
        emergencyCooldownUntil: cooldownTime,
        emergencyUnlocks: newUnlocks
      });
    } catch (e) {
      console.error("Failed to store unlock reason locally", e);
    }

    // 2. Store in backend database
    try {
      const { accessToken } = await chrome.storage.local.get(['accessToken']);
      if (accessToken) {
        await fetch('http://localhost:3001/api/analytics/emergency-unlock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ domain: domainStr, reason })
        });
      }
    } catch (e) {
      console.error("Failed to store unlock reason in database", e);
    }

    setSubmitting(false);

    // Go back to the original URL
    if (url) {
      window.location.href = url;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 font-sans">
      <FocusCoachModal
        isOpen={showCoachModal}
        onClose={() => setShowCoachModal(false)}
        currentGoal={currentGoal}
        onReturnToWork={handleCloseTab}
      />

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-8 relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-red-500/20 blur-3xl rounded-full pointer-events-none"></div>

        <div className="relative z-10">
          {showSurvey ? (
            <div className="space-y-6">
              <div className="mx-auto w-20 h-20 bg-orange-500/10 border border-orange-500/20 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-10 h-10 text-orange-500 animate-pulse" />
              </div>
              
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
                Why do you need access?
              </h2>
              <p className="text-slate-400 text-xs mb-6">
                We'll log this unlock request locally and to your analytics dashboard.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {(['Work Related', 'Quick Check', 'Habit', 'Bored'] as const).map((reason) => (
                  <button
                    key={reason}
                    onClick={() => submitUnlockReason(reason)}
                    disabled={submitting}
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-750 active:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-sm font-medium transition-all border border-slate-700/50 hover:border-slate-600 disabled:opacity-50"
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowSurvey(false)}
                disabled={submitting}
                className="w-full mt-4 py-2 px-4 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-all"
              >
                Cancel and Go Back
              </button>
            </div>
          ) : (
            <>
              <div className="mx-auto w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6">
                <Shield className="w-10 h-10 text-red-500" />
              </div>
              
              <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-500">
                Site Blocked
              </h1>
              <p className="text-slate-400 text-sm mb-6 break-all line-clamp-2" title={url}>
                {url}
              </p>
              
              {currentGoal && (
                <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20 mb-6 text-left">
                  <p className="text-red-400 font-semibold text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    This does not help your current goal.
                  </p>
                  <p className="text-xs text-slate-400 mt-1 pl-6">
                    Focus Target: <span className="text-white font-medium">"{currentGoal}"</span>
                  </p>
                </div>
              )}

              <div className="mb-8">
                <FocusCoachCard
                  url={url}
                  currentGoal={currentGoal}
                  isPro={isPro}
                  onLoadCoaching={(msg) => setCoachingMsg(msg)}
                />
              </div>

              <div className="space-y-4">
                <button 
                  onClick={handleCloseTab}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Close Tab
                </button>
                
                <button 
                  onClick={handleTemporaryUnlock}
                  disabled={cooldown > 0}
                  className={`w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    cooldown > 0 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                      : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
                  }`}
                >
                  {cooldown > 0 ? (
                    <>
                      <Clock className="w-5 h-5" />
                      Unlock on cooldown ({Math.floor(cooldown / 60)}:{(cooldown % 60).toString().padStart(2, '0')})
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-orange-400" />
                      Emergency 5-Min Unlock
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
