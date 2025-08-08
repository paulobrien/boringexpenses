import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginForm from './components/auth/LoginForm';
import AppLayout from './components/app/AppLayout';
import AddExpense from './components/app/AddExpense';
import ViewExpenses from './components/app/ViewExpenses';
import Settings from './components/app/Settings';
import MarketingSite from './components/MarketingSite';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Marketing site */}
        <Route path="/" element={<MarketingSite />} />
        
        {/* App routes - protected */}
        <Route path="/app" element={
          user ? (
            <AppLayout />
          ) : (
            <LoginForm />
          )
        }>
          <Route index element={<AddExpense />} />
          <Route path="expenses" element={<ViewExpenses />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;