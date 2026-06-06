import { Brain, LayoutDashboard, Clock, BarChart2, Settings, Zap, ShieldCheck, LogOut, Crown, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../hooks/useSubscription';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenPricing: () => void;
}

const navItems = [
  { id: 'overview',      label: 'Overview',      icon: LayoutDashboard },
  { id: 'focus',         label: 'Focus Sessions', icon: Clock },
  { id: 'analytics',    label: 'Analytics',      icon: BarChart2 },
  { id: 'reports',       label: 'Weekly AI Reports', icon: FileText },
  { id: 'blocklist',     label: 'Block List',     icon: ShieldCheck },
  { id: 'settings',      label: 'Settings',       icon: Settings },
];

export default function Sidebar({ activeTab, setActiveTab, onOpenPricing }: SidebarProps) {
  const { user, signOut } = useAuth();
  const { isPro } = useSubscription();

  return (
    <aside className="w-64 shrink-0 min-h-screen bg-[#0A0A0B] border-r border-white/[0.06] flex flex-col sticky top-0 h-screen select-none">

      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-white tracking-tight">DeepWork</span>
          <span className="text-[10px] block text-slate-500 font-medium -mt-0.5">AI Focus Engine</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left
                ${isActive
                  ? 'bg-white/[0.08] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                }
              `}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : ''}`} />
              {label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Upgrade Banner — only shown to free users */}
      {!isPro && (
        <div className="px-3 pb-3">
          <button
            onClick={onOpenPricing}
            className="w-full rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 p-4 text-left hover:border-blue-500/40 transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
              <span className="text-xs font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                Upgrade to Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Unlock AI coaching, unlimited history &amp; advanced analytics.
            </p>
          </button>
        </div>
      )}

      {/* User + Signout */}
      <div className="px-3 pb-4 border-t border-white/[0.06] pt-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
            {user?.email?.[0] ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.email ?? 'User'}</p>
            <p className={`text-[10px] flex items-center gap-1 ${isPro ? 'text-blue-400' : 'text-slate-500'}`}>
              {isPro && <Crown className="w-2.5 h-2.5" />}
              {isPro ? 'Pro Plan' : 'Free Plan'}
            </p>
          </div>
          <button
            onClick={signOut}
            title="Sign out"
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </aside>
  );
}
