import { Sparkles, Shield, Zap, Flame, Brain, Clock } from 'lucide-react';

export default function Benefits() {
  const benefits = [
    {
      title: 'Dopamine Detox Engine',
      desc: 'Break the addictive cycle of rapid context switching. Our AI identifies subconscious distraction loops before they derail your day.',
      icon: Sparkles,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Zero-Latency Interception',
      desc: 'Built on Manifest V3 declarative navigation APIs. Forbidden sites are intercepted instantly before a single byte is downloaded.',
      icon: Shield,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      title: 'Flow State Optimization',
      desc: 'Track your biological focus peaks. Recharts-powered analytics reveal exactly when you achieve maximum cognitive efficiency.',
      icon: Zap,
      color: 'text-green-400',
      bg: 'bg-green-500/10 border-green-500/20',
    },
    {
      title: 'Streak & Habit Formation',
      desc: 'Gamify your deep work. Build unbreakable productivity streaks that wire your brain for sustained, high-impact output.',
      icon: Flame,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10 border-orange-500/20',
    },
    {
      title: 'Personalized AI Coaching',
      desc: 'Receive tailored, 1-sentence motivational interventions generated dynamically by analyzing your specific browsing habits.',
      icon: Brain,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
    },
    {
      title: 'Automated Time Tracking',
      desc: 'No manual stopwatch required. Background service workers log your focus and break intervals with absolute mathematical precision.',
      icon: Clock,
      color: 'text-teal-400',
      bg: 'bg-teal-500/10 border-teal-500/20',
    },
  ];

  return (
    <section id="benefits" className="py-24 border-t border-white/[0.08] relative select-none">
      <div className="max-w-7xl mx-auto px-6 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Transform your productivity aesthetic.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Every feature is meticulously crafted to eliminate cognitive friction and protect your most valuable asset: your attention.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <div 
                key={i} 
                className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-3xl p-8 shadow-xl relative overflow-hidden group hover:border-white/[0.15] hover:shadow-2xl transition-all duration-300 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 ${b.bg} ${b.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {b.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                    {b.desc}
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
