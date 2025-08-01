import React from 'react';
import { Star, Quote } from 'lucide-react';

const Testimonials: React.FC = () => {
  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'CFO',
      company: 'TechVenture Inc.',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      content: 'Boring Expenses transformed our expense management completely. The AI accuracy is incredible, and we\'ve reduced processing time by 85%. Our team actually enjoys submitting expenses now!',
      rating: 5
    },
    {
      name: 'Michael Rodriguez',
      role: 'Operations Director',
      company: 'Global Dynamics',
      avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      content: 'The automated approval workflows are a game-changer. What used to take days now happens in minutes. The ROI was evident within the first month of implementation.',
      rating: 5
    },
    {
      name: 'Emily Johnson',
      role: 'HR Manager',
      company: 'InnovateLab',
      avatar: 'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      content: 'Our employees love how simple it is to use. Just snap a photo and the AI does the rest. No more lost receipts or manual data entry. It\'s genuinely boring in the best way possible.',
      rating: 5
    },
    {
      name: 'David Park',
      role: 'Finance Manager',
      company: 'StartupX',
      avatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      content: 'The analytics and reporting features give us insights we never had before. We can track spending patterns, identify cost savings, and make data-driven financial decisions.',
      rating: 5
    },
    {
      name: 'Lisa Thompson',
      role: 'Controller',
      company: 'Enterprise Solutions',
      avatar: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      content: 'Implementation was seamless, and the support team is outstanding. The enterprise features like custom workflows and SSO integration made it perfect for our organization.',
      rating: 5
    },
    {
      name: 'James Wilson',
      role: 'CEO',
      company: 'Growth Co.',
      avatar: 'https://images.pexels.com/photos/2182975/pexels-photo-2182975.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      content: 'Boring Expenses scaled with us from 20 to 200 employees. The AI gets smarter over time, and the cost savings from automation more than justify the investment.',
      rating: 5
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
            <Star className="h-4 w-4 mr-2" />
            Customer Success Stories
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Loved by Finance Teams Everywhere
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of companies that have made expense management boringly simple 
            with our AI-powered platform.
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-8 mb-16">
          {[
            { number: '2,500+', label: 'Companies Trust Us' },
            { number: '99.2%', label: 'AI Accuracy Rate' },
            { number: '85%', label: 'Time Saved' },
            { number: '4.9/5', label: 'Customer Rating' }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                {stat.number}
              </div>
              <p className="text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 relative"
            >
              <Quote className="h-8 w-8 text-blue-200 mb-4" />
              
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed">
                  "{testimonial.content}"
                </p>
              </div>

              <div className="flex items-center">
                <img 
                  src={testimonial.avatar} 
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-gray-600 text-sm">
                    {testimonial.role} at {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-8 md:p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Join These Happy Customers?
          </h3>
          <p className="text-xl mb-8 text-blue-100">
            Start your 14-day free trial today and see why thousands of companies 
            choose Boring Expenses for their expense management needs.
          </p>
          <button
            onClick={() => {
              const element = document.getElementById('contact');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
          >
            Start Free Trial
          </button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;