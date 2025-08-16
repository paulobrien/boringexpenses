import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Plus, Receipt, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Logo = () => (
  <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 4C12.95 4 4 12.95 4 24C4 35.05 12.95 44 24 44C35.05 44 44 35.05 44 24C44 12.95 35.05 4 24 4ZM24 34H16V30H24V26H16V22H24V18H16V14H28V34H24Z" fill="#0A0A2A"/>
  </svg>
);

const AppLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

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
    <div className="min-h-screen bg-secondary">
      {/* Mobile header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between bg-white/5 px-4 py-3 border-b border-gray-300/10">
          <div className="flex items-center space-x-3">
            <Logo />
            <span className="text-lg font-bold text-text-primary">Expenses</span>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors duration-200"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="lg:flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
          <div className="flex flex-col flex-grow bg-white/5 border-r border-gray-300/10">
            {/* Logo */}
            <div className="flex items-center px-6 py-4 border-b border-gray-300/10">
              <div className="flex items-center space-x-3">
                <Logo />
                <span className="text-lg font-bold text-text-primary">Expenses</span>
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
                        ? 'bg-accent/10 text-accent border border-accent/20'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* User section */}
            <div className="px-6 py-4 border-t border-gray-300/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                    <span className="text-accent font-semibold text-sm">
                      {user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-text-secondary hover:text-text-primary transition-colors duration-200"
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
          <div className="p-4 lg:p-8">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/5 border-t border-gray-300/10 backdrop-blur-sm">
        <nav className="flex justify-around py-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center py-2 px-3 text-xs font-medium transition-colors duration-200 ${
                  isActive
                    ? 'text-accent'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <item.icon className={`h-5 w-5 mb-1 ${isActive ? 'text-accent' : 'text-text-secondary/70'}`} />
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