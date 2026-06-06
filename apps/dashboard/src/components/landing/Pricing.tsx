import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 border-t border-white/[0.08] relative select-none bg-gradient-to-b from-white/[0.02] to-transparent">
      <div className="max-w-7xl mx-auto px-6 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Simple, transparent pricing.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Invest in your attention. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
          {/* Free Plan */}
          <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-8 sm:p-12 flex flex-col justify-between space-y-8 relative group hover:border-white/[0.15] transition-all">
            <div className="space-y-6">
              <div>
                <span className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs font-semibold text-slate-400 uppercase tracking-wider">Free Tier</span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mt-2">Basic Focus</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Essential tools for lightweight distraction blocking.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-extrabold text-white">$0</span>
                <span className="text-xs text-slate-500 font-medium">/ month</span>
              </div>

              <ul className="space-y-4 pt-6 text-xs sm:text-sm text-slate-300 border-t border-white/[0.08]">
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

            <Link 
              to="/dashboard" 
              className="w-full py-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 font-bold text-xs transition-all text-center active:scale-95 block"
            >
              Get Started for Free
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-b from-blue-600/10 via-indigo-600/10 to-transparent border-2 border-blue-500/50 rounded-3xl p-8 sm:p-12 flex flex-col justify-between space-y-8 relative group hover:shadow-[0_0_40px_rgba(59,130,246,0.2)] transition-all">
            <div className="absolute -top-3 right-8 px-4 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest shadow-lg">
              Popular / Best Value
            </div>

            <div className="space-y-6">
              <div>
                <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-xs font-semibold text-blue-400 uppercase tracking-wider">Pro Tier</span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mt-2">DeepWork Operating System</h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">Unlimited AI coaching and elite focus features.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-extrabold text-white">$12</span>
                <span className="text-xs text-slate-400 font-medium">/ month</span>
              </div>

              <ul className="space-y-4 pt-6 text-xs sm:text-sm text-slate-200 border-t border-white/[0.08]">
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

            <Link 
              to="/dashboard" 
              className="w-full py-4 rounded-2xl bg-white text-black hover:bg-slate-200 font-bold text-xs transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)] active:scale-95 text-center block"
            >
              Start 7-Day Free Trial
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
