import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "How does the AI Focus Coach work?",
      a: "The AI Focus Coach analyzes your local behavioral metrics (such as rapid tab switching, doomscrolling ticks, and blocked site attempts) and uses advanced LLM heuristics to generate real-time, 1-sentence motivational prompts tailored to your specific distraction patterns."
    },
    {
      q: "Is my browsing data private?",
      a: "Yes. All behavioral tracking occurs entirely locally within your browser's background service worker. Your browsing history is never stored on our cloud servers."
    },
    {
      q: "What is Whitelist Strict Mode?",
      a: "Unlike traditional blockers that rely on a blacklist, Strict Mode flips the paradigm. When activated during a Deep Work session, it blocks every website on the internet except for the specific domains you have explicitly whitelisted (e.g., GitHub, StackOverflow)."
    },
    {
      q: "Can I use DeepWork AI across multiple devices?",
      a: "Absolutely. Your focus state, custom blocklists, and productivity heatmaps automatically synchronize across all Chrome instances via Supabase and chrome.storage.local parity."
    },
  ];

  return (
    <section id="faq" className="py-24 border-t border-white/[0.08] relative select-none">
      <div className="max-w-4xl mx-auto px-6 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Everything you need to know about the product and how it protects your attention.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div 
                key={i} 
                className="bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full p-6 text-left font-bold text-base sm:text-lg text-white flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-xs sm:text-sm text-slate-400 leading-relaxed font-medium border-t border-white/[0.04] pt-4 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
