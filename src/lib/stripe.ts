import { loadStripe } from '@stripe/stripe-js';
import { PlanType } from './supabase';

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

if (!stripePublicKey) {
  console.warn('Missing Stripe public key. Subscription features will not work.');
}

export const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

// Plan configuration mapping to Stripe price IDs
export const PLAN_CONFIG = {
  free: {
    name: 'Free',
    description: 'Basic features with 24-hour trial of premium AI',
    price: 0,
    stripePriceId: null,
    features: [
      'Up to 5 expenses per month',
      'Basic receipt upload',
      '24-hour premium AI trial',
      'Email support',
      'Basic reporting',
    ],
    limits: {
      expensesPerMonth: 5,
      aiProcessing: false, // Only during trial
      advancedReporting: false,
      prioritySupport: false,
    }
  },
  pro_monthly: {
    name: 'Pro Monthly',
    description: 'Full features billed monthly',
    price: 29,
    stripePriceId: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID,
    period: 'month',
    features: [
      'Unlimited expenses',
      'Advanced AI receipt processing',
      'Smart categorization & insights',
      'Priority email support',
      'Advanced analytics & reporting',
      'API access',
      'Bulk expense upload',
      'Custom approval workflows',
    ],
    limits: {
      expensesPerMonth: null, // unlimited
      aiProcessing: true,
      advancedReporting: true,
      prioritySupport: true,
    }
  },
  pro_annual: {
    name: 'Pro Annual',
    description: 'Full features billed annually (2 months free)',
    price: 290, // 10 months price for 12 months
    monthlyPrice: 24.17,
    stripePriceId: import.meta.env.VITE_STRIPE_PRO_ANNUAL_PRICE_ID,
    period: 'year',
    savings: '17% savings',
    features: [
      'Unlimited expenses',
      'Advanced AI receipt processing',
      'Smart categorization & insights',
      'Priority email support',
      'Advanced analytics & reporting',
      'API access',
      'Bulk expense upload',
      'Custom approval workflows',
      '2 months free!',
    ],
    limits: {
      expensesPerMonth: null, // unlimited
      aiProcessing: true,
      advancedReporting: true,
      prioritySupport: true,
    }
  },
} as const;

// Helper function to get plan config
export function getPlanConfig(planType: PlanType) {
  return PLAN_CONFIG[planType];
}

// Helper function to check if a feature is available for a plan
export function hasFeatureAccess(planType: PlanType, feature: keyof typeof PLAN_CONFIG.pro_monthly.limits) {
  const config = getPlanConfig(planType);
  return config.limits[feature];
}

// Map Stripe price IDs back to plan types (for webhook processing)
export function getPlanTypeFromStripePrice(stripePriceId: string): PlanType | null {
  for (const [planType, config] of Object.entries(PLAN_CONFIG)) {
    if (config.stripePriceId === stripePriceId) {
      return planType as PlanType;
    }
  }
  return null;
}

// Billing URLs
export const BILLING_PORTAL_URL = '/api/stripe/create-portal-session';
export const CHECKOUT_SESSION_URL = '/api/stripe/create-checkout-session';

export interface CreateCheckoutSessionRequest {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreatePortalSessionRequest {
  returnUrl: string;
}