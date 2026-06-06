import { Brain, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FinalCTA() {
  return (
    <section className="py-32 border-t border-white/[0.08] relative overflow-hidden select-none text-center">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 relative z-10 space-y-8">
        <div className="mx-auto w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-2xl animate-bounce">
          <Brain className="w-8 h-8" />
        </div>

        <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
          Take back control of your attention today.
        </h2>

        <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed font-medium">
          Join thousands of elite software engineers and designers who have transformed their productivity aesthetic.
        </p>

        <div className="pt-4 flex justify-center">
          <Link 
            to="/dashboard" 
            className="flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-white text-black hover:bg-slate-200 font-bold text-base transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-95 group"
          >
            <span>Start Your 7-Day Free Trial</span>
            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 text-xs text-slate-500 font-medium pt-4">
          <span>No credit card required</span>
          <span>•</span>
          <span>Cancel anytime</span>
          <span>•</span>
          <span>Installs in 30 seconds</span>
        </div>
      </div>
    </section>
  );
}
