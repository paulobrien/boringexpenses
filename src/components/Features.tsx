import React from 'react';
import { Brain, CheckCircle, CreditCard, BarChart3, Users, Shield, Zap } from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: Brain,
      title: 'AI Receipt Processing',
      description: 'Automatically extract data from receipts using advanced OCR and machine learning technology.',
    },
    {
      icon: CheckCircle,
      title: 'Automated Approvals',
      description: 'Smart AI agents handle expense approvals based on your company policies and spending limits.',
    },
    {
      icon: CreditCard,
      title: 'Payment Automation',
      description: 'Streamline reimbursements with automated payment processing and bank integrations.',
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Get instant insights into spending patterns, budget tracking, and expense trends.',
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Manage multiple teams, departments, and approval workflows with role-based access.',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level encryption, compliance tools, and audit trails for complete data protection.',
    }
  ];

  return (
    <section id="features" className="py-24 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium">
            <Zap className="h-4 w-4 mr-2" />
            Powerful Features
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tighter">
            Everything You Need for Modern Expense Management
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Our AI-powered platform combines cutting-edge technology with intuitive design 
            to make expense management effortless for companies of all sizes.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group p-8 rounded-2xl border border-gray-300/10 hover:border-accent/30 hover:shadow-lg transition-all duration-300 bg-white/5"
            >
              <div className="inline-flex p-3 rounded-xl bg-accent/10 mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-4">
                {feature.title}
              </h3>
              <p className="text-text-secondary leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* AI Showcase */}
        <div className="mt-24 bg-gradient-to-r from-accent/5 to-primary/5 rounded-3xl p-8 md:p-12 border border-gray-300/10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium">
                <Brain className="h-4 w-4 mr-2" />
                AI-Powered Intelligence
              </div>
              <h3 className="text-3xl font-bold text-text-primary tracking-tighter">
                Smart AI That Learns Your Business
              </h3>
              <p className="text-lg text-text-secondary leading-relaxed">
                Our advanced AI agents don't just process expenses—they learn your company's 
                spending patterns, policy preferences, and approval workflows to make increasingly 
                intelligent decisions over time.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <span className="text-text-secondary">99.2% accuracy in receipt data extraction</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <span className="text-text-secondary">Automatic policy compliance checking</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <span className="text-text-secondary">Intelligent categorization and tagging</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white/5 rounded-2xl shadow-xl p-6 border border-gray-300/10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-text-secondary">AI Analysis</span>
                  <div className="flex items-center text-success text-sm">
                    <div className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse"></div>
                    Processing
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Receipt Data Extraction</span>
                    <span className="text-success font-medium">100%</span>
                  </div>
                  <div className="w-full bg-gray-300/20 rounded-full h-2">
                    <div className="bg-success h-2 rounded-full w-full"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Policy Compliance</span>
                    <span className="text-success font-medium">Approved</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Category</span>
                    <span className="text-accent font-medium">Business Meals</span>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-accent text-white p-3 rounded-full">
                <Brain className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;