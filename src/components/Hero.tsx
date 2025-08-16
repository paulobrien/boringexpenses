import React from 'react';
import { ArrowRight, Brain, Zap, Shield } from 'lucide-react';

const Hero: React.FC = () => {
  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToFeatures = () => {
    const element = document.getElementById('features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="pt-16 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Hero Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium">
                <Brain className="h-4 w-4 mr-2" />
                AI-Powered Expense Management
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary leading-tight tracking-tighter">
                Intelligent Expense Management,{' '}
                <span className="text-accent">Simplified</span>
              </h1>
              <p className="text-xl text-text-secondary leading-relaxed">
                Transform your company's expense management with AI that processes receipts, 
                automates approvals, and handles payments—so you can focus on what matters most.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={scrollToContact}
                className="inline-flex items-center justify-center bg-accent text-white px-8 py-4 rounded-lg text-lg font-semibold hover:opacity-90 transition-all duration-200 transform hover:scale-105"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button
                onClick={scrollToFeatures}
                className="inline-flex items-center justify-center border border-gray-300/50 text-text-secondary px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/5 transition-colors duration-200"
              >
                See How It Works
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6 pt-4">
              <div className="flex items-center text-text-secondary">
                <Shield className="h-5 w-5 mr-2 text-success" />
                <span className="text-sm">Bank-level Security</span>
              </div>
              <div className="flex items-center text-text-secondary">
                <Zap className="h-5 w-5 mr-2 text-accent" />
                <span className="text-sm">99.9% Uptime</span>
              </div>
              <div className="text-text-secondary text-sm">
                Trusted by <strong>2,500+</strong> companies
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative">
            <div className="bg-white/5 rounded-2xl shadow-2xl p-8 relative overflow-hidden border border-gray-300/10">
              {/* Mock App Interface */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-text-primary">Recent Expenses</h3>
                  <div className="flex items-center bg-accent/10 text-accent px-3 py-1 rounded-full text-sm">
                    <Brain className="h-4 w-4 mr-1" />
                    AI Processing
                  </div>
                </div>
                
                {/* Mock Expense Items */}
                <div className="space-y-4">
                  {[
                    { vendor: 'Uber', amount: '$24.50', status: 'Approved', category: 'Transportation' },
                    { vendor: 'Starbucks', amount: '$12.75', status: 'Processing', category: 'Meals' },
                    { vendor: 'Office Depot', amount: '$89.99', status: 'Approved', category: 'Supplies' }
                  ].map((expense, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-gray-300/10">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                          <span className="text-accent font-semibold text-sm">
                            {expense.vendor.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{expense.vendor}</p>
                          <p className="text-sm text-text-secondary">{expense.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-text-primary">{expense.amount}</p>
                        <p className={`text-sm ${
                          expense.status === 'Approved' ? 'text-success' : 'text-warning'
                        }`}>
                          {expense.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating AI Indicator */}
              <div className="absolute -top-4 -right-4 bg-accent text-white p-3 rounded-full shadow-lg">
                <Brain className="h-6 w-6" />
              </div>
            </div>

            {/* Background Decorations */}
            <div className="absolute -z-10 top-8 left-8 w-32 h-32 bg-accent/20 rounded-full opacity-20 blur-2xl"></div>
            <div className="absolute -z-10 bottom-8 right-8 w-40 h-40 bg-primary/20 rounded-full opacity-20 blur-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;