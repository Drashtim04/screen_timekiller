import { Star } from 'lucide-react';

export default function Testimonials() {
  const testimonials = [
    {
      quote: "DeepWork AI completely cured my tab-switching addiction. The strict mode combined with the AI coaching prompt feels like having a dedicated productivity manager sitting next to me.",
      author: "Alex Rivera",
      role: "Senior Staff Engineer",
      avatar: "AR",
    },
    {
      quote: "As a product designer, getting into a flow state is everything. The 60-day contribution heatmap gamifies my focus in a way that actually works. Best $12 I spend every month.",
      author: "Sophia Chen",
      role: "Lead Product Designer",
      avatar: "SC",
    },
    {
      quote: "We deployed DeepWork AI across our entire engineering org. The decrease in context switching and the surge in PR velocity was noticeable within the very first week.",
      author: "Marcus Vance",
      role: "CTO & Co-Founder",
      avatar: "MV",
    },
  ];

  return (
    <section className="py-24 border-t border-white/[0.08] relative select-none">
      <div className="max-w-7xl mx-auto px-6 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Trusted by elite builders.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            See how software engineers, designers, and founders are taking back control of their attention.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div 
              key={i} 
              className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-3xl p-8 shadow-xl relative overflow-hidden group hover:border-white/[0.15] transition-all duration-300 flex flex-col justify-between space-y-8"
            >
              <div className="space-y-4">
                <div className="flex gap-1 text-yellow-500">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                  "{t.quote}"
                </p>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-white/[0.08]">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0 shadow-inner">
                  {t.avatar}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">{t.author}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
