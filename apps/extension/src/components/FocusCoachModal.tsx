import { Brain, Sparkles, X, Target, Flame, ArrowLeft, ArrowRight } from "lucide-react";

interface FocusCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoal: string | null;
  onReturnToWork: () => void;
}

export default function FocusCoachModal({ isOpen, onClose, currentGoal, onReturnToWork }: FocusCoachModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-slate-900 border border-violet-500/30 rounded-3xl p-8 shadow-2xl text-center space-y-6 overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Background gradient decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-violet-600/20 blur-3xl rounded-full pointer-events-none"></div>

        {/* Modal Header */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative w-20 h-20 bg-violet-500/10 border border-violet-500/30 rounded-full flex items-center justify-center mb-6">
            <Brain className="w-10 h-10 text-violet-400 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center border-2 border-slate-900">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2 bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
            Focus Intercepted!
          </h2>
          <p className="text-slate-400 text-xs max-w-xs leading-relaxed">
            This is your first distraction during this focus session. Your AI Focus Coach is locking you back in.
          </p>
        </div>

        {/* Focus Goal Section */}
        {currentGoal && (
          <div className="relative z-10 p-4 bg-violet-950/20 rounded-2xl border border-violet-500/20 text-left space-y-1.5">
            <span className="flex items-center gap-1.5 text-[10px] text-violet-400 font-bold uppercase tracking-wider">
              <Target className="w-3.5 h-3.5" /> Your Current Target
            </span>
            <p className="text-sm text-slate-100 font-medium pl-5">
              "{currentGoal}"
            </p>
          </div>
        )}

        {/* Call to Action Buttons */}
        <div className="relative z-10 space-y-3 pt-2">
          <button
            onClick={onReturnToWork}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20"
          >
            <ArrowLeft className="w-5 h-5" />
            Yes, Return to Work
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-all border border-slate-700/50 flex items-center justify-center gap-1.5"
          >
            Continue to Blocked Page
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
