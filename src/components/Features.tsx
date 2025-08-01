import React from 'react';
import { Brain, Camera, CheckCircle, CreditCard, BarChart3, Users, Shield, Zap } from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: Brain,
      title: 'AI Receipt Processing',
      description: 'Automatically extract data from receipts using advanced OCR and machine learning technology.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: CheckCircle,
      title: 'Automated Approvals',
      description: 'Smart AI agents handle expense approvals based on your company policies and spending limits.',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: CreditCard,
      title: 'Payment Automation',
      description: 'Streamline reimbursements with automated payment processing and bank integrations.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Get instant insights into spending patterns, budget tracking, and expense trends.',
      color: 'text-amber-600',
      bgColor: 'bg-amber-100'
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Manage multiple teams, departments, and approval workflows with role-based access.',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level encryption, compliance tools, and audit trails for complete data protection.',
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
            <Zap className="h-4 w-4 mr-2" />
            Powerful Features
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Everything You Need for Modern Expense Management
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our AI-powered platform combines cutting-edge technology with intuitive design 
            to make expense management effortless for companies of all sizes.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group p-8 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 bg-white"
            >
              <div className={`inline-flex p-3 rounded-xl ${feature.bgColor} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* AI Showcase */}
        <div className="mt-20 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-8 md:p-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                <Brain className="h-4 w-4 mr-2" />
                AI-Powered Intelligence
              </div>
              <h3 className="text-3xl font-bold text-gray-900">
                Smart AI That Learns Your Business
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Our advanced AI agents don't just process expenses—they learn your company's 
                spending patterns, policy preferences, and approval workflows to make increasingly 
                intelligent decisions over time.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">99.2% accuracy in receipt data extraction</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Automatic policy compliance checking</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">Intelligent categorization and tagging</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-500">AI Analysis</span>
                  <div className="flex items-center text-green-600 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Processing
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Receipt Data Extraction</span>
                    <span className="text-green-600 font-medium">100%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full w-full"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Policy Compliance</span>
                    <span className="text-green-600 font-medium">Approved</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Category</span>
                    <span className="text-blue-600 font-medium">Business Meals</span>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-blue-600 text-white p-3 rounded-full">
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