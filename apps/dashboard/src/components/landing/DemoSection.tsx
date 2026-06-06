import { useState } from 'react';
import { Brain, ShieldAlert, Activity, Zap } from 'lucide-react';

export default function DemoSection() {
  const [activeTab, setActiveTab] = useState<'ai' | 'strict' | 'analytics'>('ai');

  const tabs = [
    { id: 'ai', label: 'AI Focus Coach', icon: Brain, desc: 'Real-time intervention when your attention drifts.' },
    { id: 'strict', label: 'Whitelist Strict Mode', icon: ShieldAlert, desc: 'Complete lockdown. Only essential websites allowed.' },
    { id: 'analytics', label: '60-Day Heatmaps', icon: Activity, desc: 'Beautiful GitHub-style visualization of your flow state.' },
  ];

  return (
    <section id="demo" className="py-24 border-t border-white/[0.08] relative select-none">
      <div className="max-w-7xl mx-auto px-6 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Engineered for dopamine detox.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            DeepWork AI operates at the browser level, combining neural heuristics with strict OS-level timers to guarantee unbroken focus.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Left Navigation Tabs */}
          <div className="space-y-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-left p-6 rounded-3xl border transition-all flex items-start gap-4 group ${
                    isActive 
                      ? 'bg-white/[0.05] border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]' 
                      : 'bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15]'
                  }`}
                >
                  <div className={`p-3 rounded-2xl border transition-colors shrink-0 ${
                    isActive ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-white/[0.04] border-white/[0.08] text-slate-400 group-hover:text-slate-300'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className={`font-bold text-base transition-colors ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                      {tab.label}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {tab.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Visual Display */}
          <div className="lg:col-span-2 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.12] rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden min-h-[400px] flex items-center justify-center">
            <div className="absolute -right-20 -bottom-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            {activeTab === 'ai' && (
              <div className="space-y-6 w-full max-w-lg animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-[#0A0A0B] border border-white/[0.12] rounded-2xl p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                        AI
                      </div>
                      <span className="text-sm font-bold text-white">Neural Coach Alert</span>
                    </div>
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Distraction Intercepted</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    "You've switched tabs 6 times in 45 seconds while researching Webpack configs. Let's close Reddit and maintain your 3-day streak."
                  </p>
                  <div className="flex gap-2 pt-2">
                    <button className="flex-1 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-slate-200 transition-colors shadow-sm">
                      Lock Down Focus
                    </button>
                    <button className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 font-semibold text-xs transition-colors">
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'strict' && (
              <div className="space-y-6 w-full max-w-lg animate-in fade-in zoom-in-95 duration-300 text-center">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">Strict Mode Lockdown</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    All non-whitelisted domains are strictly blocked at the `chrome.webNavigation` layer. Zero latency redirection. Zero willpower required.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] inline-flex items-center gap-3 text-xs text-slate-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Allowed: github.com, stackoverflow.com, docs.plasmo.com</span>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6 w-full max-w-lg animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-[#0A0A0B] border border-white/[0.12] rounded-2xl p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">60-Day Contribution Heatmap</h4>
                    <span className="text-xs text-green-400 font-bold">+34 hrs Deep Work</span>
                  </div>
                  <div className="grid grid-cols-12 gap-1.5 pt-2">
                    {Array.from({ length: 48 }).map((_, i) => {
                      const levels = ['bg-white/[0.03]', 'bg-blue-500/20', 'bg-blue-500/40', 'bg-blue-500/70', 'bg-blue-500'];
                      const random = levels[Math.floor(Math.random() * levels.length)];
                      return <div key={i} className={`h-6 rounded-md ${random}`} />;
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-white/[0.08]">
                    <span>Current Streak: 14 Days</span>
                    <span>Best Streak: 21 Days</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </section>
  );
}
