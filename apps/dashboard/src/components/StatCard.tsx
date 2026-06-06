import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: LucideIcon;
  subtitle: string;
  iconColor?: string;
}

export default function StatCard({ title, value, trend, icon: Icon, subtitle, iconColor = 'text-blue-400' }: StatCardProps) {
  const isPositive = trend && trend > 0;

  return (
    <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-white/[0.15] hover:shadow-2xl transition-all duration-300">
      {/* Ambient background glow on hover */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
          {title}
        </span>
        <div className={`p-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] ${iconColor} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-3xl font-bold tracking-tight text-white tabular-nums">
          {value}
        </span>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
            isPositive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500 font-medium">
        {subtitle}
      </p>
    </div>
  );
}
