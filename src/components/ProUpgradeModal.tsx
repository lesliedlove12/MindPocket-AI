import React, { useState } from 'react';
import {
  X,
  Crown,
  Check,
  Shield,
  Infinity as InfinityIcon,
  Mic,
  Image,
  Bell,
  Search,
  Cloud,
  FolderPlus,
  RefreshCw,
  Sparkles,
  Info,
} from 'lucide-react';
import { AppSettings } from '../types';
import { SubscriptionService, PRICING } from '../services/subscriptionService';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpgrade: () => void;
  rationale?: string | null;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpgrade,
  rationale,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [upgradedSuccess, setUpgradedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    setIsProcessing(true);
    setStatusMessage('Creating Stripe Checkout session...');
    setCheckoutUrl(null);

    try {
      const res = await SubscriptionService.subscribe(selectedPlan);
      setIsProcessing(false);

      if (res.success) {
        setStatusMessage('Redirecting to Stripe Checkout...');
        if (res.url) {
          setCheckoutUrl(res.url);
        }
      } else {
        setStatusMessage(res.message);
      }
    } catch (err: any) {
      setIsProcessing(false);
      setStatusMessage('Payment error: ' + (err?.message || 'Unable to complete checkout'));
    }
  };

  const handleRestore = async () => {
    setIsProcessing(true);
    setStatusMessage('Checking purchase records...');

    try {
      const res = await SubscriptionService.restorePurchases();
      setIsProcessing(false);
      setStatusMessage(res.message);

      if (res.restored) {
        onUpgrade();
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      setIsProcessing(false);
      setStatusMessage('Restore failed: ' + (err?.message || 'Error communicating with provider'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#3C3C3B]/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 text-[#3C3C3B] dark:text-stone-100 w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-[#E5E0D8] dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Banner */}
        <div className="relative p-6 bg-[#5A5A40] text-[#F9F7F2] flex flex-col items-center text-center">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-[#3C3C3B]/20 text-[#F9F7F2] hover:bg-[#3C3C3B]/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-[#F9F7F2] text-[#5A5A40] flex items-center justify-center font-bold shadow-xl mb-3">
            <Crown className="w-8 h-8 fill-[#5A5A40]" />
          </div>

          <span className="px-3 py-0.5 rounded-full bg-[#3C3C3B] text-[#F9F7F2] text-[10px] font-bold uppercase tracking-wider mb-1">
            MindPocket Pro
          </span>

          <h2 className="text-2xl font-serif font-bold tracking-tight text-[#F9F7F2]">
            Unlock MindPocket Pro
          </h2>
          <p className="text-xs text-[#F9F7F2]/90 font-medium max-w-xs mt-1">
            Never lose a memory again with unlimited photo, voice, and cloud storage.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Feature Trigger Rationale Alert */}
          {rationale && !upgradedSuccess && (
            <div className="p-3.5 bg-[#F2EDE4] dark:bg-stone-800 rounded-2xl border border-[#E5E0D8] dark:border-stone-700 flex items-start gap-2.5 text-xs text-[#5A5A40] dark:text-stone-200">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#5A5A40]" />
              <div>
                <span className="font-bold block text-[11px] uppercase tracking-wider text-[#7B8E7E]">
                  Pro Feature Required
                </span>
                <p className="mt-0.5 leading-snug font-medium">{rationale}</p>
              </div>
            </div>
          )}

          {upgradedSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-[#5A5A40] text-[#F9F7F2] rounded-full flex items-center justify-center mx-auto animate-bounce">
                <Check className="w-10 h-10 stroke-[3]" />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#5A5A40]">Welcome to MindPocket Pro!</h3>
              <p className="text-xs text-[#7B8E7E]">
                Your subscription is now active. Enjoy unlimited photo, voice, and cloud sync memories!
              </p>
            </div>
          ) : (
            <>
              {/* Pricing Display Block */}
              <div className="p-4 bg-[#F2EDE4]/70 dark:bg-stone-800/80 rounded-2xl border border-[#E5E0D8] dark:border-stone-700 space-y-3">
                <div className="text-center">
                  <span className="text-xs font-bold text-[#7B8E7E] uppercase tracking-wider block mb-1">
                    Select Your Plan
                  </span>
                </div>

                {/* Plan Options Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Monthly Option */}
                  <div
                    onClick={() => setSelectedPlan('monthly')}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative ${
                      selectedPlan === 'monthly'
                        ? 'border-[#5A5A40] bg-white dark:bg-stone-900 shadow-sm'
                        : 'border-transparent bg-white/50 dark:bg-stone-800/50 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#3C3C3B] dark:text-stone-200">
                        Monthly Plan
                      </span>
                      {selectedPlan === 'monthly' && (
                        <span className="w-4 h-4 rounded-full bg-[#5A5A40] text-white flex items-center justify-center text-[10px]">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="text-lg font-serif font-bold text-[#5A5A40] dark:text-stone-100">
                      $6.99/month
                    </div>
                    <p className="text-[11px] text-[#7B8E7E] mt-0.5">
                      Standard monthly billing
                    </p>
                  </div>

                  {/* Yearly Option */}
                  <div
                    onClick={() => setSelectedPlan('yearly')}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative ${
                      selectedPlan === 'yearly'
                        ? 'border-[#5A5A40] bg-white dark:bg-stone-900 shadow-sm'
                        : 'border-transparent bg-white/50 dark:bg-stone-800/50 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#3C3C3B] dark:text-stone-200">
                        Annual Plan
                      </span>
                      {selectedPlan === 'yearly' && (
                        <span className="w-4 h-4 rounded-full bg-[#5A5A40] text-white flex items-center justify-center text-[10px]">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="text-lg font-serif font-bold text-[#5A5A40] dark:text-stone-100">
                      $69.99/year
                    </div>
                    <p className="text-[10px] font-bold text-[#5A5A40] dark:text-stone-300 mt-0.5">
                      (Save approximately $14 per year)
                    </p>
                  </div>
                </div>

                {/* Clear Pricing Summary Callout */}
                <div className="text-center pt-1 border-t border-[#E5E0D8] dark:border-stone-700">
                  <p className="text-xs text-[#3C3C3B] dark:text-stone-300 font-semibold">
                    MindPocket Pro: <span className="font-bold text-[#5A5A40]">$6.99/month</span> OR <span className="font-bold text-[#5A5A40]">$69.99/year</span>
                  </p>
                </div>
              </div>

              {/* Pro Feature Checklist */}
              <div className="space-y-3 pt-1">
                <p className="text-xs font-bold text-[#7B8E7E] uppercase tracking-wider text-center">
                  Included in MindPocket Pro:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-[#F2EDE4]/60 dark:bg-stone-800/80 rounded-xl border border-[#E5E0D8] dark:border-stone-700/80 flex items-center gap-2.5">
                    <InfinityIcon className="w-4 h-4 text-[#5A5A40] shrink-0" />
                    <span className="font-semibold text-[#3C3C3B] dark:text-stone-200">Unlimited memories</span>
                  </div>

                  <div className="p-2.5 bg-[#F2EDE4]/60 dark:bg-stone-800/80 rounded-xl border border-[#E5E0D8] dark:border-stone-700/80 flex items-center gap-2.5">
                    <Image className="w-4 h-4 text-[#5A5A40] shrink-0" />
                    <span className="font-semibold text-[#3C3C3B] dark:text-stone-200">Unlimited photo/Snap memories</span>
                  </div>

                  <div className="p-2.5 bg-[#F2EDE4]/60 dark:bg-stone-800/80 rounded-xl border border-[#E5E0D8] dark:border-stone-700/80 flex items-center gap-2.5">
                    <Mic className="w-4 h-4 text-[#5A5A40] shrink-0" />
                    <span className="font-semibold text-[#3C3C3B] dark:text-stone-200">Voice/Say memories</span>
                  </div>

                  <div className="p-2.5 bg-[#F2EDE4]/60 dark:bg-stone-800/80 rounded-xl border border-[#E5E0D8] dark:border-stone-700/80 flex items-center gap-2.5">
                    <Cloud className="w-4 h-4 text-[#5A5A40] shrink-0" />
                    <span className="font-semibold text-[#3C3C3B] dark:text-stone-200">Cloud sync</span>
                  </div>

                  <div className="p-2.5 bg-[#F2EDE4]/60 dark:bg-stone-800/80 rounded-xl border border-[#E5E0D8] dark:border-stone-700/80 flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-[#5A5A40] shrink-0" />
                    <span className="font-semibold text-[#3C3C3B] dark:text-stone-200">Smart reminders</span>
                  </div>

                  <div className="p-2.5 bg-[#F2EDE4]/60 dark:bg-stone-800/80 rounded-xl border border-[#E5E0D8] dark:border-stone-700/80 flex items-center gap-2.5">
                    <Search className="w-4 h-4 text-[#5A5A40] shrink-0" />
                    <span className="font-semibold text-[#3C3C3B] dark:text-stone-200">Advanced search</span>
                  </div>

                  <div className="p-2.5 bg-[#F2EDE4]/60 dark:bg-stone-800/80 rounded-xl border border-[#E5E0D8] dark:border-stone-700/80 flex items-center gap-2.5">
                    <FolderPlus className="w-4 h-4 text-[#5A5A40] shrink-0" />
                    <span className="font-semibold text-[#3C3C3B] dark:text-stone-200">Unlimited categories</span>
                  </div>

                  <div className="p-2.5 bg-[#F2EDE4]/60 dark:bg-stone-800/80 rounded-xl border border-[#E5E0D8] dark:border-stone-700/80 flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#5A5A40] shrink-0" />
                    <span className="font-semibold text-[#3C3C3B] dark:text-stone-200">Premium features as added</span>
                  </div>
                </div>
              </div>

              {/* Status or error message */}
              {statusMessage && (
                <div className="p-3 bg-[#F2EDE4] dark:bg-stone-800 rounded-xl text-xs font-bold text-center text-[#5A5A40] dark:text-stone-200 border border-[#E5E0D8]">
                  {statusMessage}
                </div>
              )}

              {/* Direct Checkout Link Button if Checkout Session Created */}
              {checkoutUrl ? (
                <a
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#5A5A40] hover:bg-[#4A4A33] text-[#F9F7F2] font-bold text-sm shadow-xl active:scale-98 transition-all flex items-center justify-center gap-2 text-center"
                >
                  <Crown className="w-5 h-5 fill-[#F9F7F2]" />
                  <span>Click here to open Stripe Checkout</span>
                </a>
              ) : (
                /* Upgrade Button */
                <button
                  onClick={handleSubscribe}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#5A5A40] hover:bg-[#4A4A33] text-[#F9F7F2] font-bold text-sm shadow-xl active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  <Crown className="w-5 h-5 fill-[#F9F7F2]" />
                  <span>
                    {isProcessing
                      ? 'Connecting to Payment Provider...'
                      : `Subscribe to MindPocket Pro (${selectedPlan === 'monthly' ? '$6.99/month' : '$69.99/year'})`}
                  </span>
                </button>
              )}

              {/* Restore Purchases & Security Footer */}
              <div className="space-y-2 text-center pt-1">
                <button
                  type="button"
                  onClick={handleRestore}
                  disabled={isProcessing}
                  className="text-xs font-bold text-[#5A5A40] dark:text-stone-300 hover:underline inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Restore Purchases
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#7B8E7E]">
                  <Shield className="w-3.5 h-3.5 text-[#5A5A40]" />
                  <span>Encrypted subscription. Cancel anytime.</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
