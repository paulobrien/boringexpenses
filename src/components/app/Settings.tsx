import React, { useState, useEffect } from 'react';
import { User, Save, Check, Building } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

const Settings: React.FC = () => {
  const { user, profile, validateSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [profileData, setProfileData] = useState({ full_name: '' });

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    const isValidSession = await validateSession();
    if (!isValidSession || !user) return;
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) setProfileData({ full_name: data.full_name || '' });
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setSuccess(false);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: profileData.full_name,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2 tracking-tighter">Settings</h1>
        <p className="text-text-secondary">Manage your account preferences and profile information.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white/5 rounded-2xl shadow-lg p-8 border border-gray-300/10">
          <div className="flex items-center mb-6">
            <User className="h-6 w-6 text-accent mr-3" />
            <h2 className="text-xl font-bold text-text-primary">Profile Information</h2>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg flex items-center">
              <Check className="h-5 w-5 text-success mr-2" />
              <span className="text-success">Profile updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">Email Address</label>
              <input
                type="email"
                id="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 rounded-lg border border-gray-300/20 bg-black/20 text-text-secondary cursor-not-allowed"
              />
              <p className="text-xs text-text-secondary/70 mt-1">Email cannot be changed. Contact support if you need to update your email.</p>
            </div>

            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-text-secondary mb-2">Full Name</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={profileData.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-lg border border-gray-300/20 bg-white/5 focus:ring-2 focus:ring-accent focus:border-accent transition-colors duration-200"
              />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-accent text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200 flex items-center justify-center">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="mr-2 h-5 w-5" /> Save Changes</>}
            </button>
          </form>
        </div>

        <div className="bg-white/5 rounded-2xl shadow-lg p-8 border border-gray-300/10">
          <div className="flex items-center mb-6">
            <Building className="h-6 w-6 text-accent mr-3" />
            <h2 className="text-xl font-bold text-text-primary">Company Information</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-300/10">
              <span className="text-text-secondary">Company Name</span>
              <span className="font-medium text-text-primary">{profile?.company?.name || 'No company assigned'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-300/10">
              <span className="text-text-secondary">Company ID</span>
              <span className="font-medium text-text-primary text-sm">{profile?.company?.id || 'N/A'}</span>
            </div>
          </div>
          <div className="mt-6 p-4 bg-accent/10 rounded-lg">
            <p className="text-sm text-accent"><strong>Note:</strong> Company settings can only be changed by contacting support. This ensures proper access control and data security.</p>
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl shadow-lg p-8 border border-gray-300/10">
          <h2 className="text-xl font-bold text-text-primary mb-6">Account Information</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-300/10">
              <span className="text-text-secondary">Account Type</span>
              <span className="font-medium text-text-primary">Free Trial</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-300/10">
              <span className="text-text-secondary">Member Since</span>
              <span className="font-medium text-text-primary">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-text-secondary">User ID</span>
              <span className="font-medium text-text-primary text-sm">{user?.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;