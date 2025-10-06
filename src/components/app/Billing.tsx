import React, { useState } from 'react';
import { 
  CreditCard, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  ExternalLink,
  Crown
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getPlanConfig } from '../../lib/stripe';
import { supabase } from '../../lib/supabase';

const Billing: React.FC = () => {
  const { profile, hasActiveSubscription, hasPremiumAccess, isTrialExpired, getTrialDaysRemaining } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!profile) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800">Please sign in to view billing information.</span>
          </div>
        </div>
      </div>
    );
  }

  const currentPlan = getPlanConfig(profile.plan_type);
  const isPremium = hasPremiumAccess();
  const trialExpired = isTrialExpired();
  const trialDays = getTrialDaysRemaining();

  const handleManageBilling = async () => {
    setLoading(true);
    try {
      if (!profile?.stripe_customer_id) {
        alert('No billing information found. Please upgrade to a paid plan first.');
        return;
      }

      const response = await supabase.functions.invoke('create-portal-session', {
        body: {
          returnUrl: `${window.location.origin}/app/billing`
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { url } = response.data;
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      alert('Error opening billing portal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planType: 'pro_monthly' | 'pro_annual') => {
    setLoading(true);
    try {
      const priceId = planType === 'pro_monthly' 
        ? import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID
        : import.meta.env.VITE_STRIPE_PRO_ANNUAL_PRICE_ID;

      if (!priceId) {
        throw new Error('Stripe price ID not configured');
      }

      const response = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          successUrl: `${window.location.origin}/app/billing?success=true`,
          cancelUrl: `${window.location.origin}/app/billing?canceled=true`
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { url } = response.data;
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      alert('Error starting upgrade process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (profile.subscription_status === 'active') {
      return (
        <div className="flex items-center space-x-2 text-green-700 bg-green-100 px-3 py-1 rounded-full text-sm">
          <CheckCircle className="h-4 w-4" />
          <span>Active</span>
        </div>
      );
    }
    
    if (profile.subscription_status === 'trialing') {
      if (trialExpired) {
        return (
          <div className="flex items-center space-x-2 text-red-700 bg-red-100 px-3 py-1 rounded-full text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Trial Expired</span>
          </div>
        );
      } else {
        return (
          <div className="flex items-center space-x-2 text-blue-700 bg-blue-100 px-3 py-1 rounded-full text-sm">
            <Clock className="h-4 w-4" />
            <span>{trialDays} day{trialDays !== 1 ? 's' : ''} left</span>
          </div>
        );
      }
    }
    
    return (
      <div className="flex items-center space-x-2 text-gray-700 bg-gray-100 px-3 py-1 rounded-full text-sm">
        <AlertTriangle className="h-4 w-4" />
        <span className="capitalize">{profile.subscription_status}</span>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-600 mt-2">Manage your subscription and billing information</p>
      </div>

      {/* Current Plan Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {profile.plan_type === 'free' ? (
                <CreditCard className="h-6 w-6 text-blue-600" />
              ) : (
                <Crown className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{currentPlan.name}</h2>
              <p className="text-gray-600">{currentPlan.description}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Plan Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Price:</span>
                <span className="font-medium">
                  {profile.plan_type === 'free' ? 'Free' : `$${currentPlan.price}`}
                  {profile.plan_type !== 'free' && (
                    <span className="text-gray-500 ml-1">
                      /{currentPlan.period === 'month' ? 'month' : 'year'}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium capitalize">{profile.subscription_status}</span>
              </div>
              {profile.trial_expiry && profile.subscription_status === 'trialing' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Trial expires:</span>
                  <span className="font-medium">
                    {new Date(profile.trial_expiry).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-3">Features</h3>
            <ul className="space-y-1 text-sm">
              {currentPlan.features.slice(0, 4).map((feature, index) => (
                <li key={index} className="flex items-center text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-3">
          {profile.plan_type !== 'free' && profile.subscription_status === 'active' && (
            <button
              onClick={handleManageBilling}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {loading ? 'Loading...' : 'Manage Billing'}
            </button>
          )}
        </div>
      </div>

      {/* Upgrade Options */}
      {(profile.plan_type === 'free' || trialExpired) && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {trialExpired ? 'Your trial has expired' : 'Unlock Premium Features'}
            </h2>
            <p className="text-gray-600">
              {trialExpired 
                ? 'Upgrade to continue using advanced AI features and unlimited expenses.'
                : 'Get unlimited expenses, advanced AI processing, and premium support.'
              }
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900">Pro Monthly</h3>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">$29</div>
                  <div className="text-sm text-gray-600">/month</div>
                </div>
              </div>
              <button
                onClick={() => handleUpgrade('pro_monthly')}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Upgrade Monthly'}
              </button>
            </div>

            <div className="bg-white rounded-lg border-2 border-blue-500 p-4 relative">
              <div className="absolute -top-3 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                Best Value
              </div>
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900">Pro Annual</h3>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">$290</div>
                  <div className="text-sm text-gray-600">/year</div>
                  <div className="text-xs text-green-600 font-medium">Save 17%</div>
                </div>
              </div>
              <button
                onClick={() => handleUpgrade('pro_annual')}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Upgrade Annually'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Status */}
      {isPremium && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <span className="text-green-800 font-medium">Premium features active</span>
              <p className="text-green-700 text-sm">
                You have access to all advanced AI processing and premium features.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Support */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">Need help?</h3>
        <p className="text-gray-600 text-sm mb-3">
          Have questions about your subscription or need assistance?
        </p>
        <a
          href="#contact"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Contact Support
          <ExternalLink className="h-4 w-4 ml-1" />
        </a>
      </div>
    </div>
  );
};

export default Billing;