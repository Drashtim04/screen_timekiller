import { DistractingSite } from '../../types/analytics';
import { ShieldAlert } from 'lucide-react';

interface DistractionsListProps {
  data: DistractingSite[];
}

export default function DistractionsList({ data }: DistractionsListProps) {
  const maxAttempts = Math.max(...data.map(d => d.attempts));

  return (
    <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 shadow-xl flex flex-col space-y-6 h-full justify-between">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">Top Distractions Blocked</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">AI Engine interception breakdown</p>
        </div>
        <div className="p-2 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
          <ShieldAlert className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-4 pt-2">
        {data.map((site, i) => {
          const percentage = (site.attempts / maxAttempts) * 100;

          return (
            <div key={i} className="space-y-1.5 group">
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: site.iconColor }} />
                  <span className="text-slate-300 group-hover:text-white transition-colors">{site.domain}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[10px] text-slate-400 font-medium">
                    {site.category}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">{site.attempts} blocks</span>
                  <span className="text-green-400 font-bold">+{site.timeSaved}m saved</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.05]">
                <div 
                  className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]" 
                  style={{ width: `${percentage}%` }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
