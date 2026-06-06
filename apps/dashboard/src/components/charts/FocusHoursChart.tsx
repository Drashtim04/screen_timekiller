import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { DailyFocusData } from '../../types/analytics';

interface FocusHoursChartProps {
  data: DailyFocusData[];
}

export default function FocusHoursChart({ data }: FocusHoursChartProps) {
  return (
    <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 shadow-xl flex flex-col space-y-6 h-full justify-between">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">Focus & Deep Work Hours</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Daily breakdown of your deep work flow states</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            <span>Total Focus</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            <span>Deep Work</span>
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="deepGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="focusHours" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#focusGradient)" />
            <Area type="monotone" dataKey="deepWorkHours" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#deepGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0A0A0B] border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-2 min-w-[150px]">
        <span className="text-xs font-semibold text-slate-400">{label}</span>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="text-slate-300">Total Focus:</span>
            <span className="font-bold text-blue-400">{payload[0].value}h</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="text-slate-300">Deep Work:</span>
            <span className="font-bold text-indigo-400">{payload[1].value}h</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}
