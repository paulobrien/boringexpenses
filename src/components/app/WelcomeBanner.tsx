import React, { useState, useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const WelcomeBanner: React.FC = () => {
  const { profile } = useAuth();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user joined via invite (this is a simplified check)
    // In a real implementation, you might store this information in localStorage
    // or have a flag in the user profile that gets set during invite acceptance
    const checkInviteJoin = async () => {
      if (!profile?.company_id) return;
      
      // Check if user was created recently (within last hour) and has company_id
      // This is a heuristic to detect if they likely joined via invite
      const userCreatedRecently = profile.company && 
        new Date().getTime() - new Date(profile.company.id).getTime() < 60 * 60 * 1000;
      
      // Check localStorage to see if we should show the banner
      const hasSeenWelcome = localStorage.getItem(`welcomed_${profile.id}`);
      
      if (!hasSeenWelcome && profile.role !== 'admin') {
        setShowBanner(true);
      }
    };

    checkInviteJoin();
  }, [profile]);

  const dismissBanner = () => {
    if (profile?.id) {
      localStorage.setItem(`welcomed_${profile.id}`, 'true');
    }
    setShowBanner(false);
  };

  if (!showBanner || !profile?.company?.name) {
    return null;
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-green-800">
            Welcome to {profile.company.name}!
          </h3>
          <p className="mt-1 text-sm text-green-700">
            You've been successfully added to your company's expense management system. 
            You can now submit expenses, upload receipts, and track your business spending.
          </p>
        </div>
        <button
          onClick={dismissBanner}
          className="ml-3 flex-shrink-0 text-green-400 hover:text-green-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default WelcomeBanner;