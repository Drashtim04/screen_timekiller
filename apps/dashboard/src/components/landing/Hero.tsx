import { Link } from 'react-router-dom';
import { Brain, ArrowRight, Shield, Zap, Sparkles } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative pt-36 pb-24 overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-600/20 via-indigo-600/20 to-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 text-center relative z-10 space-y-8">
        
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-slate-300 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-500 backdrop-blur-md shadow-2xl">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">Introducing DeepWork AI 2.0</span>
          <span className="text-white/[0.2]">•</span>
          <span>The Ultimate Dopamine Detox</span>
        </div>

        {/* Heading */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.05] animate-in fade-in slide-in-from-top-6 duration-700">
          Protect your attention. <br className="hidden sm:block" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
            Master deep work.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium animate-in fade-in slide-in-from-top-8 duration-700">
          An AI-powered focus operating system that intercepts distractions, coaches your flow state, and transforms your productivity aesthetic.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-top-10 duration-700">
          <Link 
            to="/dashboard" 
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-white text-black hover:bg-slate-200 font-bold text-base transition-all shadow-[0_0_35px_rgba(255,255,255,0.25)] active:scale-95 group"
          >
            <Brain className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
            <span>Start Your Dopamine Detox</span>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a 
            href="#demo" 
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white font-semibold text-base transition-all active:scale-95 backdrop-blur-md"
          >
            <span>Explore Features</span>
          </a>
        </div>

        {/* Browser Mockup Window */}
        <div className="pt-16 max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-1000">
          <div className="rounded-3xl border border-white/[0.15] bg-[#0A0A0B]/90 backdrop-blur-2xl shadow-[0_0_80px_rgba(59,130,246,0.2)] overflow-hidden relative group">
            {/* Window Header */}
            <div className="h-12 bg-white/[0.04] border-b border-white/[0.08] px-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 border border-red-500" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 border border-yellow-500" />
                <span className="w-3 h-3 rounded-full bg-green-500/80 border border-green-500" />
              </div>
              <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-[11px] text-slate-400 font-medium">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>deepwork.ai/dashboard</span>
              </div>
              <div className="w-12" /> {/* Spacer for symmetry */}
            </div>

            {/* Window Content / Mock Preview */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left bg-gradient-to-b from-white/[0.02] to-transparent">
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Coach Alert</span>
                  <Zap className="w-4 h-4 text-blue-400 animate-pulse" />
                </div>
                <p className="text-sm text-slate-200 font-medium leading-relaxed">
                  "Rapid tab switching detected. Intercepted Twitter attempt. Let's refocus on Neural Net architecture."
                </p>
                <div className="pt-2 flex gap-2">
                  <span className="px-3 py-1 rounded-lg bg-blue-500 text-white text-xs font-bold shadow-sm">Strict Mode Active</span>
                </div>
              </div>

              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 space-y-4 md:col-span-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Focus Flow State</span>
                    <span className="text-xs font-bold text-green-400">+142% vs last week</span>
                  </div>
                  <h4 className="text-3xl font-extrabold text-white tabular-nums">4h 12m</h4>
                  <p className="text-xs text-slate-500 mt-1">Unbroken deep work session achieved today.</p>
                </div>

                {/* Mock Visual Graph */}
                <div className="h-24 flex items-end gap-2 pt-4">
                  {[20, 35, 45, 30, 60, 75, 90, 85, 95, 100].map((h, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-blue-500 to-indigo-500 rounded-t-md transition-all duration-500 hover:opacity-80" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
