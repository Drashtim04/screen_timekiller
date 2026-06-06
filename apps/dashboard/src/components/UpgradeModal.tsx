import { useState } from 'react';
import {
  X, Zap, Check, Shield, Brain, BarChart2, Flame,
  ChevronRight, Smartphone, CreditCard, Star
} from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

interface UpgradeModalProps {
  onClose: () => void;
  /** Source for analytics (e.g. 'heatmap_gate', 'sidebar', 'header') */
  source?: string;
}

const UPI_METHODS = [
  { id: 'gpay',    label: 'Google Pay',  color: '#4285F4', icon: '🅶' },
  { id: 'phonepe', label: 'PhonePe',     color: '#5F259F', icon: '𝙋' },
  { id: 'paytm',   label: 'Paytm',       color: '#00B9F1', icon: '𝙋' },
  { id: 'bhim',    label: 'BHIM UPI',    color: '#008556', icon: '𝙐' },
];

const PRO_FEATURES = [
  { icon: Shield,    label: 'Unlimited website blocking',         free: '3 sites max' },
  { icon: Brain,     label: 'AI Focus Coach & roast mode',        free: null },
  { icon: BarChart2, label: 'AI Productivity Reports',           free: null },
  { icon: Flame,     label: 'Productivity Heatmap (60 days)',     free: null },
  { icon: Zap,       label: 'Dopamine Recovery Score',           free: null },
  { icon: Star,      label: 'Advanced Analytics',                free: 'Basic only' },
];

export default function UpgradeModal({ onClose, source = 'unknown' }: UpgradeModalProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedUpi, setSelectedUpi] = useState<string | null>(null);
  const { handleUpgrade, upgrading, isDemoMode } = useSubscription();

  const monthlyPrice  = 999;
  const yearlyPrice   = 7999;
  const yearlyMonthly = Math.round(yearlyPrice / 12);
  const yearlySaving  = Math.round(((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100);

  const displayPrice = billingCycle === 'monthly' ? monthlyPrice : yearlyMonthly;

  const track = (event: string, extra: Record<string, any> = {}) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, { source, billing_cycle: billingCycle, ...extra });
    }
    // Also log to console for easy debugging
    console.log(`[Conversion] ${event}`, { source, billingCycle, ...extra });
  };

  const handlePay = async () => {
    track('upgrade_initiated', { payment_method: selectedUpi || 'cashfree_default' });
    await handleUpgrade('pro', billingCycle);
    track('upgrade_completed');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0C0C0E] border border-white/[0.1] rounded-3xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 max-h-[95vh] overflow-y-auto custom-scrollbar">

        {/* Glow accents */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 px-6 pt-6 pb-4 border-b border-white/[0.06]">
          <button
            onClick={() => { track('upgrade_modal_closed'); onClose(); }}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Upgrade to DeepWork Pro</h2>
              <p className="text-[11px] text-slate-500">Unlock your full focus potential</p>
            </div>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center gap-2 bg-white/[0.04] p-1 rounded-xl border border-white/[0.06] w-fit">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-white text-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Yearly
              {billingCycle !== 'yearly' && (
                <span className="px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[9px] font-bold">
                  -{yearlySaving}%
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Price Display */}
        <div className="relative z-10 px-6 py-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-slate-500 font-medium">₹</span>
            <span className="text-4xl font-bold text-white tabular-nums">
              {displayPrice.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-500">/ month</span>
            {billingCycle === 'yearly' && (
              <span className="ml-1 text-[11px] text-slate-500">
                (₹{yearlyPrice.toLocaleString('en-IN')} billed annually)
              </span>
            )}
          </div>
          {billingCycle === 'yearly' && (
            <p className="text-[11px] text-green-400 font-semibold mt-0.5">
              You save ₹{(monthlyPrice * 12 - yearlyPrice).toLocaleString('en-IN')} per year
            </p>
          )}
        </div>

        {/* Feature List */}
        <div className="relative z-10 px-6 pb-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-3">What you unlock</p>
          <div className="space-y-2">
            {PRO_FEATURES.map(({ icon: Icon, label, free }) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Icon className="w-3 h-3 text-blue-400" />
                  </div>
                  <span className="text-xs text-slate-200 font-medium">{label}</span>
                </div>
                {free ? (
                  <span className="text-[10px] text-slate-600 shrink-0">{free}</span>
                ) : (
                  <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* UPI Payment Selection */}
        <div className="relative z-10 px-6 pb-4">
          <div className="border-t border-white/[0.06] pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-3.5 h-3.5 text-blue-400" />
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Pay via UPI (Recommended)</p>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {UPI_METHODS.map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => { setSelectedUpi(id); track('upi_selected', { upi_method: id }); }}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${
                    selectedUpi === id
                      ? 'border-blue-500/60 bg-blue-500/10 text-white'
                      : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/20 hover:bg-white/[0.05]'
                  }`}
                >
                  <span className="text-base leading-none">{
                    id === 'gpay'    ? '🇬' :
                    id === 'phonepe' ? '🅿' :
                    id === 'paytm'   ? '🅿' : '🇧'
                  }</span>
                  <span className="text-[9px] font-medium leading-none">{label}</span>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[10px] text-slate-600 font-medium">OR</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Other payment methods note */}
            <div className="flex items-center gap-2 text-[10px] text-slate-600">
              <CreditCard className="w-3 h-3" />
              <span>Cards, Net Banking & Wallets also accepted via Cashfree</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="relative z-10 px-6 pb-6">
          <button
            onClick={handlePay}
            disabled={upgrading}
            className="w-full py-3.5 rounded-2xl bg-white text-black hover:bg-slate-100 font-bold text-sm transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {upgrading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <span>{isDemoMode ? '🎉 Activate Pro (Demo)' : `Pay ₹${displayPrice.toLocaleString('en-IN')}/${billingCycle === 'yearly' ? 'yr' : 'mo'}`}</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-center text-[10px] text-slate-600 mt-3 flex items-center justify-center gap-1.5">
            <Shield className="w-3 h-3" />
            Secured by Cashfree · Cancel anytime · No hidden fees
          </p>
        </div>

      </div>
    </div>
  );
}
