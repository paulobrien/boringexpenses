import React, { useEffect, useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Plus, Receipt, Settings, LogOut, Zap, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

const AppLayout: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadSigned = async () => {
      if (!profile?.avatar_url) {
        setAvatarUrl(null);
        return;
      }
      try {
        // If avatar_url is already an http(s) URL, use it directly (backward compatibility)
        if (/^https?:\/\//i.test(profile.avatar_url)) {
          setAvatarUrl(profile.avatar_url);
          return;
        }
        const { data, error } = await supabase.storage
          .from('images')
          .createSignedUrl(profile.avatar_url, 60 * 60);
        if (error) throw error;
        setAvatarUrl(data?.signedUrl || null);
      } catch (e) {
        console.error('Error creating signed URL for sidebar avatar:', e);
        setAvatarUrl(null);
      }
    };
    loadSigned();
  }, [profile?.avatar_url]);

  const navigation = [
    { name: 'View Expenses', href: '/app', icon: Receipt },
    { name: 'Add Expense', href: '/app/add', icon: Plus },
    { name: 'Settings', href: '/app/settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Error signing out:', error);
      alert('Error signing out. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between bg-white px-4 py-3 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-700 p-2 rounded-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Boring Expenses</span>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="lg:flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
            {/* Logo */}
            <div className="flex items-center px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="bg-blue-700 p-2 rounded-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">Boring Expenses</span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-6 py-4 space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* User section */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-gray-100">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="User avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {profile?.full_name || user?.email}
                    </p>
                    {profile?.role && (
                      <p className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        profile.role === 'admin' ? 'bg-red-100 text-red-800' :
                        profile.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64 flex-1">
          <div className="p-4 lg:p-8 pb-20 lg:pb-8">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <nav className="flex justify-around py-2 pb-[env(safe-area-inset-bottom)]">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center py-2 px-3 text-xs font-medium transition-colors duration-200 ${
                  isActive
                    ? 'text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <item.icon className={`h-5 w-5 mb-1 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AppLayout;