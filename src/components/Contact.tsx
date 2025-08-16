import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Calendar } from 'lucide-react';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    employees: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, this would send the form data to a server
    console.log('Form submitted:', formData);
    alert('Thank you for your interest! We\'ll get back to you within 24 hours.');
    setFormData({
      name: '',
      email: '',
      company: '',
      employees: '',
      message: ''
    });
  };

  return (
    <section id="contact" className="py-24 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tighter">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Join thousands of companies that have made expense management boringly simple. 
            Start your free trial or schedule a personalized demo today.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white/5 rounded-3xl p-8 md:p-12 border border-gray-300/10">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-text-primary mb-4 tracking-tighter">Start Your Free Trial</h3>
              <p className="text-text-secondary">
                Get started in minutes. No credit card required. 14-day free trial with full access to all features.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300/20 bg-white/5 focus:ring-2 focus:ring-accent focus:border-accent transition-colors duration-200"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300/20 bg-white/5 focus:ring-2 focus:ring-accent focus:border-accent transition-colors duration-200"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-text-secondary mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300/20 bg-white/5 focus:ring-2 focus:ring-accent focus:border-accent transition-colors duration-200"
                    placeholder="Your company"
                  />
                </div>
                <div>
                  <label htmlFor="employees" className="block text-sm font-medium text-text-secondary mb-2">
                    Company Size
                  </label>
                  <select
                    id="employees"
                    name="employees"
                    value={formData.employees}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300/20 bg-white/5 focus:ring-2 focus:ring-accent focus:border-accent transition-colors duration-200"
                  >
                    <option value="">Select size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-1000">201-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-text-secondary mb-2">
                  Tell us about your needs (optional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300/20 bg-white/5 focus:ring-2 focus:ring-accent focus:border-accent transition-colors duration-200"
                  placeholder="What challenges are you looking to solve with expense management?"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-accent text-white px-8 py-4 rounded-lg text-lg font-semibold hover:opacity-90 transition-opacity duration-200 flex items-center justify-center"
              >
                Start Free Trial
                <Send className="ml-2 h-5 w-5" />
              </button>

              <p className="text-sm text-text-secondary/70 text-center">
                By submitting this form, you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-text-primary mb-6 tracking-tighter">Get in Touch</h3>
              <p className="text-text-secondary mb-8">
                Have questions or need a custom solution? Our team is here to help you 
                find the perfect expense management solution for your business.
              </p>
            </div>

            {/* Contact Methods */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-accent/10 p-3 rounded-lg">
                  <Mail className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary mb-1">Email Support</h4>
                  <p className="text-text-secondary">support@expenses.com</p>
                  <p className="text-sm text-text-secondary/70">We respond within 2 hours</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-accent/10 p-3 rounded-lg">
                  <Phone className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary mb-1">Phone Support</h4>
                  <p className="text-text-secondary">+1 (555) 123-4567</p>
                  <p className="text-sm text-text-secondary/70">Mon-Fri 9AM-6PM EST</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-accent/10 p-3 rounded-lg">
                  <Calendar className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary mb-1">Schedule a Demo</h4>
                  <p className="text-text-secondary">Book a personalized walkthrough</p>
                  <button className="text-accent hover:opacity-80 text-sm font-medium transition-colors duration-200">
                    Schedule Now →
                  </button>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-accent/10 p-3 rounded-lg">
                  <MapPin className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary mb-1">Headquarters</h4>
                  <p className="text-text-secondary">
                    123 Innovation Drive<br />
                    San Francisco, CA 94105
                  </p>
                </div>
              </div>
            </div>

            {/* Additional CTAs */}
            <div className="bg-gradient-to-r from-primary to-accent/20 rounded-2xl p-8 text-white border border-gray-300/10">
              <h4 className="text-xl font-bold mb-4">Enterprise Solutions</h4>
              <p className="text-gray-300 mb-6">
                Need custom features, dedicated support, or enterprise-level security? 
                Let's discuss a tailored solution for your organization.
              </p>
              <button className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200">
                Contact Sales Team
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;