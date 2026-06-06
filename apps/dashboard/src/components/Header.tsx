import { Brain, Bell, Search, Zap, Share2 } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onShareClick?: () => void;
}

export default function Header({ activeTab, onShareClick }: HeaderProps) {
  return (
    <header className="h-16 border-b border-white/[0.08] bg-[#0A0A0B]/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-50 select-none">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-white capitalize tracking-tight">
          {activeTab}
        </h1>
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium animate-pulse">
          <Zap className="w-3.5 h-3.5" />
          <span>AI Focus Engine Active</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search analytics, logs..." 
            className="w-64 bg-white/[0.03] border border-white/[0.08] rounded-full pl-9 pr-4 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-full bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
        </button>

        {/* Share Action */}
        {onShareClick && (
          <button 
            onClick={onShareClick}
            className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-white hover:bg-white/[0.1] font-semibold text-xs transition-all active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Share Stats</span>
          </button>
        )}

        {/* Quick Action */}
        <button className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-black hover:bg-slate-200 font-semibold text-xs transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95">
          <Brain className="w-3.5 h-3.5" />
          <span>Deep Work Mode</span>
        </button>
      </div>
    </header>
  );
}
