import { Check, Sparkles, X, AlertTriangle } from 'lucide-react';

interface PricingModalProps {
  onClose: () => void;
  onUpgrade: (plan?: string, billingCycle?: string) => void;
  isPro?: boolean;
  renewalDate?: Date | null;
  onCancel?: () => void;
  cancelling?: boolean;
}

export default function PricingModal({ onClose, onUpgrade, isPro, renewalDate, onCancel, cancelling }: PricingModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#0A0A0B] border border-white/[0.12] rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col space-y-8 animate-in zoom-in-95 duration-300">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-all z-20">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 relative z-10">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Unlock Peak Productivity
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Choose the perfect plan to eliminate distractions and maintain elite deep work flow states.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 items-stretch">
          {/* Free Plan */}
          <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-8 flex flex-col justify-between space-y-8 relative group hover:border-white/[0.15] transition-all">
            <div className="space-y-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs font-semibold text-slate-400 uppercase tracking-wider">Free Tier</span>
                <h3 className="text-2xl font-bold text-white mt-2">Basic Focus</h3>
                <p className="text-xs text-slate-500 mt-1">Essential tools for lightweight distraction blocking.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-xs text-slate-500 font-medium">/ month</span>
              </div>

              <ul className="space-y-3 pt-4 text-xs text-slate-300 border-t border-white/[0.08]">
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Max 3 blocked websites</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Standard Pomodoro timer</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Basic analytics dashboard</span>
                </li>
              </ul>
            </div>

            <button onClick={onClose} className="w-full py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 font-semibold text-xs transition-all active:scale-95">
              Current Plan
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-b from-blue-600/10 via-indigo-600/10 to-transparent border-2 border-blue-500/50 rounded-3xl p-8 flex flex-col justify-between space-y-8 relative group hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all">
            <div className="absolute -top-3 right-8 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest shadow-lg">
              Popular / Best Value
            </div>

            <div className="space-y-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-xs font-semibold text-blue-400 uppercase tracking-wider">Pro Tier</span>
                <h3 className="text-2xl font-bold text-white mt-2">DeepWork Operating System</h3>
                <p className="text-xs text-slate-400 mt-1">Unlimited AI coaching and elite focus features.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">$12</span>
                <span className="text-xs text-slate-400 font-medium">/ month</span>
              </div>

              <ul className="space-y-3 pt-4 text-xs text-slate-200 border-t border-white/[0.08]">
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-semibold text-white">Unlimited website blocking</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-semibold text-white">AI Focus Coaching & tailored prompts</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-semibold text-white">Advanced 60-day productivity heatmaps</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-semibold text-white">Strict Mode (Whitelist-only Deep Work)</span>
                </li>
              </ul>
            </div>

            {isPro ? (
              <div className="space-y-3">
                {renewalDate && (
                  <p className="text-center text-xs text-slate-400">
                    Renews <span className="text-white font-semibold">{renewalDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </p>
                )}
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all active:scale-95"
                >
                  ✓ Currently Active
                </button>
                {onCancel && (
                  <button
                    onClick={onCancel}
                    disabled={cancelling}
                    className="w-full py-2 rounded-xl bg-transparent border border-red-500/30 text-red-400 hover:border-red-500/60 hover:text-red-300 font-medium text-xs transition-all disabled:opacity-50"
                  >
                    {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                  </button>
                )}
                <p className="text-center text-[10px] text-slate-600 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Access continues until end of billing period.
                </p>
              </div>
            ) : (
              <button onClick={() => onUpgrade('pro', 'monthly')} className="w-full py-3 rounded-xl bg-white text-black hover:bg-slate-200 font-bold text-xs transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95">
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
