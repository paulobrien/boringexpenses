import React from 'react';
import { Clock, Crown, AlertTriangle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const SubscriptionBanner: React.FC = () => {
  const { profile, hasActiveSubscription, hasPremiumAccess, isTrialExpired, getTrialDaysRemaining } = useAuth();

  if (!profile) return null;

  const trialDays = getTrialDaysRemaining();
  const isActive = hasActiveSubscription();
  const expired = isTrialExpired();

  // Show different banners based on subscription status
  if (expired) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
            <div>
              <h3 className="text-red-800 font-medium">Trial Expired</h3>
              <p className="text-red-700 text-sm">Upgrade to continue using premium AI features</p>
            </div>
          </div>
          <Link
            to="/app/billing"
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    );
  }

  if (profile.subscription_status === 'trialing' && trialDays > 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <h3 className="text-blue-800 font-medium">
                {trialDays} day{trialDays !== 1 ? 's' : ''} left in your free trial
              </h3>
              <p className="text-blue-700 text-sm">You have full access to all premium features</p>
            </div>
          </div>
          <Link
            to="/app/billing"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Upgrade
          </Link>
        </div>
      </div>
    );
  }

  if (profile.subscription_status === 'past_due') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-yellow-800 font-medium">Payment Required</h3>
              <p className="text-yellow-700 text-sm">Update your payment method to continue using premium features</p>
            </div>
          </div>
          <Link
            to="/app/billing"
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-700 transition-colors"
          >
            Update Payment
          </Link>
        </div>
      </div>
    );
  }

  if (profile.plan_type !== 'free' && isActive) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <Crown className="h-5 w-5 text-green-600 mr-3" />
          <div>
            <h3 className="text-green-800 font-medium">
              {profile.plan_type === 'pro_monthly' ? 'Pro Monthly' : 'Pro Annual'} Plan Active
            </h3>
            <p className="text-green-700 text-sm">You have access to all premium features</p>
          </div>
        </div>
      </div>
    );
  }

  // Free plan - show upgrade option
  if (profile.plan_type === 'free' && profile.subscription_status !== 'trialing') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-gray-600 mr-3" />
            <div>
              <h3 className="text-gray-800 font-medium">Free Plan</h3>
              <p className="text-gray-700 text-sm">Limited to 5 expenses per month</p>
            </div>
          </div>
          <Link
            to="/app/billing"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Upgrade
          </Link>
        </div>
      </div>
    );
  }

  return null;
};

export default SubscriptionBanner;