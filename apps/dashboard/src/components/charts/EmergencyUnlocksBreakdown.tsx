import { AlertTriangle } from 'lucide-react';

interface EmergencyUnlocksProps {
  data: {
    total: number;
    reasons: Record<string, number>;
  };
}

export default function EmergencyUnlocksBreakdown({ data }: EmergencyUnlocksProps) {
  const total = data?.total || 0;
  const reasons = data?.reasons || {
    'Work Related': 0,
    'Quick Check': 0,
    'Habit': 0,
    'Bored': 0
  };

  const maxCount = Math.max(...Object.values(reasons), 1);

  return (
    <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 shadow-xl flex flex-col space-y-6 h-full justify-between">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">Emergency Unlocks</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">5-min bypass reason logs</p>
        </div>
        <div className="p-2 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      {total === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-slate-400 font-medium">No emergency unlocks requested</p>
          <p className="text-xs text-slate-600 mt-1">Maintaining perfect discipline!</p>
        </div>
      ) : (
        <div className="space-y-4 pt-2 flex-1">
          {Object.entries(reasons).map(([reason, count]) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;
            const barWidth = (count / maxCount) * 100;

            return (
              <div key={reason} className="space-y-1.5 group">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-300 group-hover:text-white transition-colors">{reason}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{count} times</span>
                    <span className="text-orange-400 font-medium text-[10px] bg-orange-500/10 px-1.5 py-0.5 rounded-full border border-orange-500/20">
                      {Math.round(percentage)}%
                    </span>
                  </div>
                </div>

                <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.05]">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]" 
                    style={{ width: `${barWidth}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
