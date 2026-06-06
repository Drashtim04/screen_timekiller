import { useEffect, useState } from "react";
import { Brain, Lock, Sparkles, Loader2, AlertCircle, TrendingDown, Target, Zap } from "lucide-react";

interface FocusCoachCardProps {
  url: string;
  currentGoal: string | null;
  isPro: boolean;
  onLoadCoaching: (message: string) => void;
}

export default function FocusCoachCard({ url, currentGoal, isPro, onLoadCoaching }: FocusCoachCardProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [source, setSource] = useState<'groq' | 'cache' | 'fallback' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ attempts: number; score: number } | null>(null);

  useEffect(() => {
    if (!isPro) return;

    let active = true;
    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        const { accessToken } = await chrome.storage.local.get(['accessToken']);
        const { pomodoroState } = await chrome.storage.local.get(['pomodoroState']);

        let domainStr = url;
        try { domainStr = new URL(url).hostname; } catch (e) {}

        let timeRemainingSeconds = 0;
        let sessionDurationSeconds = 0;

        if (pomodoroState) {
          sessionDurationSeconds = pomodoroState.duration || 0;
          if (pomodoroState.status === 'running' && pomodoroState.endTime) {
            timeRemainingSeconds = Math.max(0, Math.floor((pomodoroState.endTime - Date.now()) / 1000));
          }
        }

        const res = await fetch('http://localhost:3001/api/ai/coach', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || ''}`
          },
          body: JSON.stringify({
            domain: domainStr,
            currentGoal,
            timeRemainingSeconds,
            sessionDurationSeconds
          })
        });

        if (!res.ok) {
          throw new Error(`Server returned error: ${res.status}`);
        }

        const data = await res.json();
        if (active) {
          if (data.success) {
            setMessage(data.message);
            setSource(data.source);
            onLoadCoaching(data.message);

            // Also, let's parse a quick simulated daily metrics view
            // In a real app we'd fetch this from analytics.ts
            setStats({
              attempts: data.source === 'fallback' ? 3 : 5, // mock fallback vs groq count
              score: 88
            });
          } else {
            throw new Error(data.error || "Failed to load coaching");
          }
        }
      } catch (err: any) {
        if (active) {
          console.error("Error fetching AI Coach message:", err);
          setError(err.message || "Unable to reach Focus Coach");
          // Generate a local client-side fallback warning as final backup
          let domainStr = url;
          try { domainStr = new URL(url).hostname; } catch (e) {}
          const localFallback = currentGoal 
            ? `You attempted to visit ${domainStr}. Stay focused on your goal: ${currentGoal}.`
            : `You attempted to visit ${domainStr}. Get back to work and protect your focus.`;
          setMessage(localFallback);
          setSource('fallback');
          onLoadCoaching(localFallback);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [url, currentGoal, isPro]);

  if (!isPro) {
    return (
      <div className="relative group overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-slate-900 to-violet-950/20 p-6 text-left shadow-lg">
        {/* Glow styling */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl opacity-10 blur-xl group-hover:opacity-15 transition duration-500"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-xs">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-violet-400 font-bold bg-violet-400/10 px-2 py-0.5 rounded-full">
              Pro Feature
            </span>
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-violet-400" />
              AI Focus Coach
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Lock in with real-time cognitive feedback tailored to your current sessions.
            </p>
          </div>
          <div className="flex items-center justify-center p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 self-stretch md:self-auto">
            <Lock className="w-5 h-5 text-violet-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950/20 p-6 text-left shadow-lg">
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 blur-3xl rounded-full pointer-events-none"></div>

      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Brain className="w-4 h-4 text-violet-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white tracking-wide flex items-center gap-1">
                AI Focus Coach
                <Sparkles className="w-3 h-3 text-violet-400" />
              </h3>
              <span className="text-[9px] text-slate-500 uppercase tracking-wider font-medium">
                Real-time Feedback {source && `• ${source}`}
              </span>
            </div>
          </div>
          {stats && (
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/50">
                <Target className="w-3 h-3 text-violet-400" /> Score: {stats.score}%
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-6 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Analyzing focus patterns...</p>
          </div>
        ) : error ? (
          <div className="space-y-3">
            <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-slate-400 leading-relaxed">
                {error}. Showing local intervention:
              </p>
            </div>
            <p className="text-sm text-slate-200 pl-4 border-l-2 border-violet-500 italic leading-relaxed">
              "{message}"
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-200 pl-4 border-l-2 border-violet-500 italic leading-relaxed py-0.5">
            "{message}"
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Static event logger for analytics tracking of Coach outcomes.
 */
export async function logCoachEvent(
  url: string,
  coachingMessage: string,
  action: 'Returned to Work' | 'Unlocked'
) {
  try {
    const { accessToken } = await chrome.storage.local.get(['accessToken']);
    if (!accessToken) return;

    let domainStr = url;
    try { domainStr = new URL(url).hostname; } catch (e) {}

    await fetch('http://localhost:3001/api/analytics/coach-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        domain: domainStr,
        coachingMessage,
        action
      })
    });
  } catch (e) {
    console.error("Failed to log coach analytics event:", e);
  }
}
