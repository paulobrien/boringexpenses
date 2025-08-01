import React from 'react';
import { Check, Star, Zap } from 'lucide-react';

const Pricing: React.FC = () => {
  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for small teams and startups',
      price: '$12',
      period: 'per user/month',
      features: [
        'Up to 50 expenses per month',
        'Basic AI receipt processing',
        'Email support',
        '2 approval workflows',
        'Standard reporting',
        'Mobile app access'
      ],
      buttonText: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Professional',
      description: 'Ideal for growing companies',
      price: '$29',
      period: 'per user/month',
      features: [
        'Unlimited expenses',
        'Advanced AI processing',
        'Priority support',
        'Unlimited approval workflows',
        'Advanced analytics',
        'API access',
        'Custom integrations',
        'Bulk expense upload'
      ],
      buttonText: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      description: 'For large organizations',
      price: 'Custom',
      period: 'pricing',
      features: [
        'Everything in Professional',
        'Dedicated account manager',
        'Custom AI model training',
        'Advanced security features',
        'Single sign-on (SSO)',
        'Custom reporting',
        'White-label options',
        'SLA guarantee'
      ],
      buttonText: 'Contact Sales',
      popular: false
    }
  ];

  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
            <Zap className="h-4 w-4 mr-2" />
            Simple Pricing
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Choose the Perfect Plan for Your Team
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Start with a 14-day free trial. No credit card required. 
            Scale as your business grows with transparent pricing.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                plan.popular 
                  ? 'border-blue-500 transform scale-105' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                    <Star className="h-4 w-4 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}
              
              <div className="p-8">
                <div className="space-y-4 mb-8">
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-600">{plan.description}</p>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    {plan.price !== 'Custom' && (
                      <span className="text-gray-600 ml-2">/{plan.period.split('/')[1]}</span>
                    )}
                  </div>
                  {plan.price !== 'Custom' && (
                    <p className="text-sm text-gray-500">{plan.period}</p>
                  )}
                </div>

                <button
                  onClick={scrollToContact}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors duration-200 mb-8 ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.buttonText}
                </button>

                <div className="space-y-4">
                  <p className="font-semibold text-gray-900">What's included:</p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5 mr-3" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-8">Trusted by companies of all sizes</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
            {['TechCorp', 'InnovateLab', 'GlobalSoft', 'DataSync'].map((company, index) => (
              <div key={index} className="text-2xl font-bold text-gray-400">
                {company}
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Teaser */}
        <div className="mt-16 bg-white rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Questions about pricing?
          </h3>
          <p className="text-gray-600 mb-6">
            Our team is here to help you choose the right plan for your business needs.
          </p>
          <button
            onClick={scrollToContact}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
          >
            Talk to Sales
          </button>
        </div>
      </div>
    </section>
  );
};

export default Pricing;