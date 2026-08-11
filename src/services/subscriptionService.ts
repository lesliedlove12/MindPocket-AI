// MindPocket Subscription Service
// Standard Subscription Pricing & Management Layer

export type SubscriptionPlan = 'free' | 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'none';

export interface SubscriptionInfo {
  isPro: boolean;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  subscribedAt?: string; // ISO date string
  renewsAt?: string;     // ISO date string
  cancelAtPeriodEnd?: boolean;
  subscriptionId?: string;
  paymentMethod?: string;
  lastRestoredAt?: string;
}

export const PRICING = {
  FREE_PRICE: '$0',
  MONTHLY_PRICE: '$6.99/month',
  MONTHLY_NUMERIC: 6.99,
  YEARLY_PRICE: '$69.99/year',
  YEARLY_NUMERIC: 69.99,
  YEARLY_SAVINGS_TEXT: 'Save approximately $14 per year',
  PRO_FEATURES: [
    'Unlimited memories',
    'Unlimited photo/Snap memories',
    'Voice/Say memories',
    'Cloud sync',
    'Smart reminders',
    'Advanced search',
    'Unlimited categories',
    'Premium features as they are added',
  ],
};

const STORAGE_KEY = 'mindpocket_subscription_v2';

export class SubscriptionService {
  /**
   * Retrieves the current subscription state from localStorage or defaults to free.
   */
  static getSubscriptionInfo(): SubscriptionInfo {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: SubscriptionInfo = JSON.parse(stored);
        
        // Expiration check if subscription was canceled
        if (parsed.renewsAt && new Date(parsed.renewsAt).getTime() < Date.now()) {
          if (parsed.cancelAtPeriodEnd) {
            const expiredState: SubscriptionInfo = {
              isPro: false,
              plan: 'free',
              status: 'expired',
              subscriptionId: parsed.subscriptionId,
            };
            SubscriptionService.saveSubscriptionInfo(expiredState);
            return expiredState;
          }
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Error reading subscription info:', e);
    }

    return {
      isPro: false,
      plan: 'free',
      status: 'none',
    };
  }

  /**
   * Persists subscription information to storage.
   */
  static saveSubscriptionInfo(info: SubscriptionInfo): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
    } catch (e) {
      console.warn('Error saving subscription info:', e);
    }
  }

  /**
   * Processes subscription checkout via server-side Stripe Checkout Sessions.
   */
  static async subscribe(plan: 'monthly' | 'yearly'): Promise<{ success: boolean; info: SubscriptionInfo; message: string; url?: string }> {
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          info: SubscriptionService.getSubscriptionInfo(),
          message: data.message || data.error || 'Failed to initiate checkout with Stripe.',
        };
      }

      if (data.url) {
        let redirected = false;

        // Strategy 1: Attempt top-level window redirect if running inside an iframe
        try {
          if (window.top && window.top !== window) {
            window.top.location.href = data.url;
            redirected = true;
          }
        } catch (e) {
          // Cross-origin iframe top navigation blocked by browser sandbox policy
        }

        // Strategy 2: Open in a new window/tab if top redirect wasn't possible
        if (!redirected) {
          try {
            const popup = window.open(data.url, '_blank', 'noopener,noreferrer');
            if (popup && !popup.closed) {
              redirected = true;
            }
          } catch (e) {
            // Popup blocked
          }
        }

        // Strategy 3: Fallback to frame navigation
        if (!redirected) {
          try {
            window.location.href = data.url;
          } catch (e) {}
        }

        return {
          success: true,
          url: data.url,
          info: SubscriptionService.getSubscriptionInfo(),
          message: 'Redirecting to Stripe Checkout...',
        };
      }

      return {
        success: false,
        info: SubscriptionService.getSubscriptionInfo(),
        message: 'No Stripe checkout URL returned from server.',
      };
    } catch (err: any) {
      console.error('Error initiating Stripe checkout:', err);
      return {
        success: false,
        info: SubscriptionService.getSubscriptionInfo(),
        message: 'Network error connecting to Stripe checkout: ' + (err?.message || 'Server unreachable'),
      };
    }
  }

  /**
   * Verifies Stripe Checkout Session completion directly with Stripe API.
   */
  static async verifySession(sessionId: string): Promise<{ verified: boolean; info: SubscriptionInfo; message: string }> {
    try {
      const response = await fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.isPro) {
        const verifiedInfo: SubscriptionInfo = {
          isPro: true,
          plan: data.plan || 'monthly',
          status: data.status || 'active',
          subscribedAt: new Date().toISOString(),
          renewsAt: data.renewsAt,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
          subscriptionId: data.subscriptionId,
        };

        SubscriptionService.saveSubscriptionInfo(verifiedInfo);

        return {
          verified: true,
          info: verifiedInfo,
          message: 'Stripe subscription verified successfully!',
        };
      } else {
        return {
          verified: false,
          info: SubscriptionService.getSubscriptionInfo(),
          message: data.message || 'Stripe checkout payment was not completed.',
        };
      }
    } catch (err: any) {
      console.error('Error verifying Stripe session:', err);
      return {
        verified: false,
        info: SubscriptionService.getSubscriptionInfo(),
        message: 'Failed to verify checkout session with Stripe.',
      };
    }
  }

  /**
   * Restores existing purchases by querying Stripe API backend.
   */
  static async restorePurchases(): Promise<{ restored: boolean; message: string; info: SubscriptionInfo }> {
    const current = SubscriptionService.getSubscriptionInfo();

    // Query Stripe API if subscription ID exists
    if (current.subscriptionId) {
      try {
        const response = await fetch('/api/stripe/verify-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscriptionId: current.subscriptionId }),
        });

        const data = await response.json();

        if (response.ok && data.success && data.isPro) {
          const restoredInfo: SubscriptionInfo = {
            ...current,
            isPro: true,
            status: data.status || 'active',
            plan: data.plan || current.plan,
            renewsAt: data.renewsAt || current.renewsAt,
            cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
            lastRestoredAt: new Date().toISOString(),
          };

          SubscriptionService.saveSubscriptionInfo(restoredInfo);

          return {
            restored: true,
            message: `Subscription verified with Stripe! MindPocket Pro is active (${restoredInfo.subscriptionId}).`,
            info: restoredInfo,
          };
        }
      } catch (e) {
        console.warn('Stripe subscription verification request failed:', e);
      }
    }

    return {
      restored: false,
      message: 'No active MindPocket Pro subscriptions verified with Stripe.',
      info: current,
    };
  }

  /**
   * Cancels subscription in Stripe at period end.
   */
  static async cancelSubscription(): Promise<{ success: boolean; info: SubscriptionInfo; message: string }> {
    const current = SubscriptionService.getSubscriptionInfo();

    if (!current.isPro || !current.subscriptionId) {
      return {
        success: false,
        info: current,
        message: 'No active Stripe subscription found to cancel.',
      };
    }

    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: current.subscriptionId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const updated: SubscriptionInfo = {
          ...current,
          cancelAtPeriodEnd: true,
          status: 'canceled',
          renewsAt: data.renewsAt || current.renewsAt,
        };

        SubscriptionService.saveSubscriptionInfo(updated);

        return {
          success: true,
          info: updated,
          message: data.message || 'Subscription set to cancel at end of current billing period.',
        };
      } else {
        return {
          success: false,
          info: current,
          message: data.message || 'Failed to cancel subscription with Stripe.',
        };
      }
    } catch (err: any) {
      console.error('Error canceling subscription:', err);
      return {
        success: false,
        info: current,
        message: 'Network error canceling subscription with Stripe.',
      };
    }
  }

  /**
   * Reactivates auto-renewal for canceled subscription in Stripe.
   */
  static async reactivateSubscription(): Promise<{ success: boolean; info: SubscriptionInfo; message: string }> {
    const current = SubscriptionService.getSubscriptionInfo();

    if (!current.subscriptionId) {
      return {
        success: false,
        info: current,
        message: 'No active Stripe subscription found to reactivate.',
      };
    }

    try {
      const response = await fetch('/api/stripe/reactivate-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: current.subscriptionId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const updated: SubscriptionInfo = {
          ...current,
          isPro: true,
          status: 'active',
          cancelAtPeriodEnd: false,
          renewsAt: data.renewsAt || current.renewsAt,
        };

        SubscriptionService.saveSubscriptionInfo(updated);

        return {
          success: true,
          info: updated,
          message: data.message || 'Subscription reactivated successfully!',
        };
      } else {
        return {
          success: false,
          info: current,
          message: data.message || 'Failed to reactivate subscription with Stripe.',
        };
      }
    } catch (err: any) {
      console.error('Error reactivating subscription:', err);
      return {
        success: false,
        info: current,
        message: 'Network error reactivating subscription with Stripe.',
      };
    }
  }

}
