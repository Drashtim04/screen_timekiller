import { TrendingUp, Clock, ShieldAlert } from 'lucide-react';

export default function Statistics() {
  const stats = [
    {
      value: '+142%',
      label: 'Deep Work Hours',
      desc: 'Average increase in unbroken focus flow states within the first 14 days of use.',
      icon: TrendingUp,
      color: 'text-blue-400',
    },
    {
      value: '2.1h',
      label: 'Daily Time Saved',
      desc: 'Recovered from mindless doomscrolling and subconscious tab switching loops.',
      icon: Clock,
      color: 'text-indigo-400',
    },
    {
      value: '94%',
      label: 'Interception Rate',
      desc: 'Of all distracting website attempts successfully blocked before cognitive drift occurs.',
      icon: ShieldAlert,
      color: 'text-green-400',
    },
  ];

  return (
    <section id="statistics" className="py-24 border-t border-white/[0.08] relative select-none bg-gradient-to-b from-white/[0.02] to-transparent">
      <div className="max-w-7xl mx-auto px-6 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Proven impact. Elite results.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            DeepWork AI isn't just a blocker. It's a mathematically optimized productivity engine trusted by top performers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div 
                key={i} 
                className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-8 shadow-xl relative overflow-hidden group hover:border-white/[0.15] transition-all duration-300 space-y-4 text-center sm:text-left"
              >
                <div className="flex items-center justify-center sm:justify-between">
                  <span className={`text-5xl sm:text-6xl font-extrabold tracking-tight text-white tabular-nums ${s.color}`}>
                    {s.value}
                  </span>
                  <div className="hidden sm:flex p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-slate-400 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight mt-2">
                    {s.label}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-1 font-medium">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
