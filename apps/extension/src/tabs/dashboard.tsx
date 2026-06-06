import { useEffect, useState } from "react";
import { Brain, Flame, Clock, CheckCircle2, BarChart2 } from "lucide-react";
import "../style.css";

interface SessionStats {
  sessionsToday: number;
  focusMinutesToday: number;
  streakDays: number;
  sessionCount: number;
  history: Array<{
    id: string;
    startTime: number;
    duration: number;
    completed: boolean;
    mode: string;
    goal?: string;
  }>;
  currentGoal?: string | null;
}

function formatTime(startTime: number): string {
  return new Date(startTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}

export default function DashboardTab() {
  const [stats, setStats] = useState<SessionStats>({
    sessionsToday: 0,
    focusMinutesToday: 0,
    streakDays: 0,
    sessionCount: 0,
    history: [],
  });

  useEffect(() => {
    const updateStats = () => {
      chrome.storage.local.get("pomodoroState", ({ pomodoroState }) => {
        if (!pomodoroState) return;

        const todayStr = new Date().toISOString().split("T")[0];
        const todaySessions = (pomodoroState.history || []).filter((s: any) => {
          return (
            s.completed &&
            s.mode === "pomodoro" &&
            new Date(s.startTime).toISOString().split("T")[0] === todayStr
          );
        });

        const focusMinutesToday = todaySessions.reduce(
          (sum: number, s: any) => sum + Math.floor(s.duration / 60),
          0
        );

        setStats({
          sessionsToday: todaySessions.length,
          focusMinutesToday,
          streakDays: pomodoroState.streakDays || 0,
          sessionCount: pomodoroState.sessionCount || 0,
          history: pomodoroState.history || [],
          currentGoal: pomodoroState.status === 'running' && pomodoroState.mode === 'pomodoro' ? pomodoroState.currentGoal : null,
        });
      });
    };

    updateStats();

    const listener = (changes: any, namespace: string) => {
      if (namespace === 'local' && changes.pomodoroState) {
        updateStats();
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const statCards = [
    {
      label: "Sessions Today",
      value: stats.sessionsToday,
      icon: CheckCircle2,
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.1)",
      suffix: "",
    },
    {
      label: "Focus Time Today",
      value: stats.focusMinutesToday,
      icon: Clock,
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.1)",
      suffix: "m",
    },
    {
      label: "Current Streak",
      value: stats.streakDays,
      icon: Flame,
      color: "#f97316",
      bg: "rgba(249,115,22,0.1)",
      suffix: "d",
    },
    {
      label: "Total Sessions",
      value: stats.sessionCount,
      icon: BarChart2,
      color: "#22c55e",
      bg: "rgba(34,197,94,0.1)",
      suffix: "",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white font-sans p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">DeepWork AI</h1>
            <p className="text-xs text-white/40">Session Statistics</p>
          </div>
        </div>

        {/* Active Focus Goal Banner */}
        {stats.currentGoal && (
          <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-blue-950/40 border border-purple-500/20 rounded-2xl p-4 mb-8 shadow-md">
            <p className="text-[13px] font-semibold text-purple-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
              Active Goal: <span className="text-white">"{stats.currentGoal}"</span>
            </p>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, color, bg, suffix }) => (
            <div
              key={label}
              className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 hover:border-white/[0.14] transition-colors"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: bg }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div className="text-3xl font-bold tabular-nums mb-1">
                {value}
                <span className="text-lg font-medium text-white/40 ml-1">
                  {suffix}
                </span>
              </div>
              <div className="text-xs text-white/40 font-medium">{label}</div>
            </div>
          ))}
        </div>

        {/* Session History */}
        <div>
          <h2 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wider">
            Recent Sessions
          </h2>
          {stats.history.length === 0 ? (
            <div className="text-center py-12 text-white/30 text-sm">
              <Clock className="w-8 h-8 mx-auto mb-3 opacity-30" />
              No sessions yet — start your first Pomodoro!
            </div>
          ) : (
            <div className="space-y-2">
              {stats.history.slice(0, 20).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 hover:border-white/[0.1] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        session.mode === "pomodoro"
                          ? "bg-blue-400"
                          : session.mode === "shortBreak"
                          ? "bg-green-400"
                          : "bg-purple-400"
                      }`}
                    />
                    <div>
                      <div className="text-sm font-medium text-white/80 capitalize">
                        {session.goal ? session.goal : (session.mode === "pomodoro"
                          ? "Focus Session"
                          : session.mode === "shortBreak"
                          ? "Short Break"
                          : "Long Break")}
                      </div>
                      <div className="text-xs text-white/30 flex items-center gap-1.5 mt-0.5">
                        <span>{formatTime(session.startTime)}</span>
                        {session.goal && (
                          <>
                            <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                            <span className="text-purple-400 font-medium capitalize">{session.mode}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/40">
                      {formatDuration(session.duration)}
                    </span>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        session.completed
                          ? "bg-green-500/10 text-green-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {session.completed ? "✓ Done" : "Skipped"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
