import { SessionLog } from '../../types/analytics';
import { Brain, Clock, Zap } from 'lucide-react';

interface SessionHistoryTableProps {
  data: SessionLog[];
}

export default function SessionHistoryTable({ data }: SessionHistoryTableProps) {
  return (
    <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 shadow-xl flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">Focus Session Logs</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Recent deep work intervals & AI coach notes</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-slate-300">
          <Clock className="w-3.5 h-3.5 text-blue-400 animate-spin" />
          <span>Syncing Live</span>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.08] text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="pb-4 pl-2">Task / Project</th>
              <th className="pb-4">Duration</th>
              <th className="pb-4">Efficiency</th>
              <th className="pb-4">AI Coach Analysis</th>
              <th className="pb-4 pr-2">Tags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-xs">
            {data.map((session) => (
              <tr key={session.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="py-4 pl-2 font-semibold text-slate-200 group-hover:text-white transition-colors">
                  {session.taskName}
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">{session.startTime}</div>
                </td>
                <td className="py-4 font-bold text-blue-400 tabular-nums">
                  {session.duration} min
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-1.5 font-semibold text-green-400">
                    <Zap className="w-3.5 h-3.5" />
                    <span>{session.efficiency}%</span>
                  </div>
                </td>
                <td className="py-4 text-slate-400 max-w-xs pr-4 leading-relaxed font-medium">
                  {session.aiNote ? (
                    <div className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/10 p-2.5 rounded-xl">
                      <Brain className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <span>{session.aiNote}</span>
                    </div>
                  ) : (
                    <span className="text-slate-600">No notes recorded.</span>
                  )}
                </td>
                <td className="py-4 pr-2">
                  <div className="flex gap-1.5 flex-wrap">
                    {session.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[10px] font-semibold text-slate-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
