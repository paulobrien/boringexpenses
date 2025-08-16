import React from 'react';
import { Users, Award, Target, Heart } from 'lucide-react';

const About: React.FC = () => {
  const values = [
    {
      icon: Target,
      title: 'Mission-Driven',
      description: 'We believe expense management should be so simple it becomes boring – in the best way possible.'
    },
    {
      icon: Users,
      title: 'Customer-Centric',
      description: 'Every feature we build starts with understanding our customers\' real-world challenges.'
    },
    {
      icon: Award,
      title: 'Innovation First',
      description: 'We leverage cutting-edge AI technology to stay ahead of industry trends and needs.'
    },
    {
      icon: Heart,
      title: 'People Matter',
      description: 'We\'re building tools that give people time back for what matters most in their work.'
    }
  ];

  const team = [
    {
      name: 'Alex Chen',
      role: 'CEO & Co-Founder',
      bio: 'Former fintech executive with 15+ years building financial software. Stanford MBA.',
      avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
    },
    {
      name: 'Sarah Martinez',
      role: 'CTO & Co-Founder',
      bio: 'AI/ML expert from Google. Led development of machine learning systems at scale.',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
    },
    {
      name: 'David Kim',
      role: 'Head of Product',
      bio: 'Product leader with deep expertise in user experience and enterprise software.',
      avatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
    }
  ];

  return (
    <section id="about" className="py-24 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tighter">
            About Expenses
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            We're on a mission to make expense management so simple and automated 
            that it becomes refreshingly boring – giving you time back for what matters most.
          </p>
        </div>

        {/* Company Story */}
        <div className="bg-white/5 rounded-3xl p-8 md:p-12 mb-16 border border-gray-300/10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-text-primary tracking-tighter">Our Story</h3>
              <div className="space-y-4 text-text-secondary leading-relaxed">
                <p>
                  Founded in 2021, Expenses was born from frustration with traditional
                  expense management systems. Our founders, having experienced the pain of 
                  manual expense processing at multiple companies, knew there had to be a better way.
                </p>
                <p>
                  We started with a simple premise: what if expense management could be so 
                  intelligent and automated that it becomes boring? What if employees could 
                  simply snap a photo and AI handled everything else?
                </p>
                <p>
                  Today, we're proud to serve over 2,500 companies worldwide, processing 
                  millions of expenses with industry-leading AI accuracy. But we're just 
                  getting started.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop"
                alt="Team collaboration"
                className="rounded-2xl shadow-lg w-full h-80 object-cover border-4 border-white/10"
              />
              <div className="absolute -bottom-6 -left-6 bg-accent text-white p-4 rounded-xl shadow-lg">
                <p className="text-2xl font-bold">2,500+</p>
                <p className="text-sm opacity-80">Happy Companies</p>
              </div>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-text-primary text-center mb-12 tracking-tighter">Our Values</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white/5 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow duration-300 border border-gray-300/10">
                <div className="inline-flex p-3 bg-accent/10 rounded-xl mb-4">
                  <value.icon className="h-6 w-6 text-accent" />
                </div>
                <h4 className="text-xl font-semibold text-text-primary mb-3">{value.title}</h4>
                <p className="text-text-secondary">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Leadership Team */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-text-primary text-center mb-12 tracking-tighter">Leadership Team</h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <div key={index} className="bg-white/5 rounded-2xl p-8 text-center hover:shadow-lg transition-shadow duration-300 border border-gray-300/10">
                <img 
                  src={member.avatar}
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-6 object-cover border-4 border-accent/20"
                />
                <h4 className="text-xl font-semibold text-text-primary mb-2">{member.name}</h4>
                <p className="text-accent font-medium mb-4">{member.role}</p>
                <p className="text-text-secondary text-sm leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-3xl p-8 md:p-12 text-white border border-gray-300/10">
          <h3 className="text-3xl font-bold text-center mb-12 text-text-primary tracking-tighter">By the Numbers</h3>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { number: '2,500+', label: 'Companies Served' },
              { number: '50M+', label: 'Expenses Processed' },
              { number: '99.2%', label: 'AI Accuracy Rate' },
              { number: '24/7', label: 'Support Available' }
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-4xl font-bold text-accent mb-2">{stat.number}</div>
                <p className="text-text-secondary">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;