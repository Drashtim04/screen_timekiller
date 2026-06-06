import React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

interface PremiumFeatureProps {
  /** Feature identifier for analytics tracking */
  feature: string;
  /** What's shown to free users instead of the children */
  teaser?: React.ReactNode;
  /** If true, renders a subtle lock overlay instead of replacing the content */
  overlay?: boolean;
  /** Called when user clicks the upgrade CTA */
  onUpgradeClick?: () => void;
  children: React.ReactNode;
}

/**
 * PremiumFeature — wraps any UI that should be gated behind the Pro plan.
 *
 * Usage:
 *   <PremiumFeature feature="heatmap" onUpgradeClick={openPricing}>
 *     <ProductivityHeatmap data={heatmap} />
 *   </PremiumFeature>
 *
 * Does NOT modify its children in any way when user is Pro.
 * Does NOT touch auth, analytics fetch logic, or backend routes.
 */
export default function PremiumFeature({
  feature,
  teaser,
  overlay = false,
  onUpgradeClick,
  children,
}: PremiumFeatureProps) {
  const { isPro, loading } = useSubscription();

  // While loading, render nothing (avoids flash)
  if (loading) return <>{children}</>;

  // Pro users see the real content — completely transparent
  if (isPro) return <>{children}</>;

  // Track that a free user hit a gated feature
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'feature_gate_hit', { feature });
  }

  // Overlay mode: show the blurred content with a lock overlay on top
  if (overlay) {
    return (
      <div className="relative group">
        <div className="pointer-events-none select-none blur-sm opacity-40 transition-all duration-300">
          {children}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0A0B]/60 backdrop-blur-[2px] rounded-2xl border border-white/[0.06] z-10">
          <div className="flex flex-col items-center gap-3 px-6 text-center">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Lock className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-xs font-semibold text-white">Pro Feature</p>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-[160px]">
              Upgrade to unlock <span className="text-slate-300 font-medium">{feature}</span>
            </p>
            {onUpgradeClick && (
              <button
                onClick={() => {
                  if ((window as any).gtag) {
                    (window as any).gtag('event', 'upgrade_click', { source: `feature_gate_${feature}` });
                  }
                  onUpgradeClick();
                }}
                className="mt-1 px-4 py-1.5 rounded-full bg-white text-black hover:bg-slate-200 font-bold text-[11px] transition-all active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.15)]"
              >
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default mode: show the teaser (or a default locked state)
  if (teaser) return <>{teaser}</>;

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] border-dashed text-center">
      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-blue-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white mb-1">Pro Feature</p>
        <p className="text-xs text-slate-500 leading-relaxed">
          Unlock <span className="text-slate-300 font-medium">{feature}</span> with a Pro subscription.
        </p>
      </div>
      {onUpgradeClick && (
        <button
          onClick={() => {
            if ((window as any).gtag) {
              (window as any).gtag('event', 'upgrade_click', { source: `feature_gate_${feature}` });
            }
            onUpgradeClick();
          }}
          className="px-6 py-2 rounded-xl bg-white text-black hover:bg-slate-200 font-bold text-xs transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
        >
          Upgrade — ₹999/month
        </button>
      )}
    </div>
  );
}
