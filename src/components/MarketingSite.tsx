import React from 'react';
import Header from './Header';
import Hero from './Hero';
import Features from './Features';
import Pricing from './Pricing';
import Testimonials from './Testimonials';
import About from './About';
import Contact from './Contact';
import Footer from './Footer';
import CookieBanner from './common/CookieBanner';

const MarketingSite: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <Features />
        <Pricing />
        <Testimonials />
        <About />
        <Contact />
      </main>
      <Footer />
      <CookieBanner />
    </div>
  );
};

export default MarketingSite;