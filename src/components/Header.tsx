import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

const Logo = () => (
  <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 4C12.95 4 4 12.95 4 24C4 35.05 12.95 44 24 44C35.05 44 44 35.05 44 24C44 12.95 35.05 4 24 4ZM24 34H16V30H24V26H16V22H24V18H16V14H28V34H24Z" fill="#0A0A2A"/>
  </svg>
);


const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-secondary/80 backdrop-blur-sm border-b border-gray-200/80 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Logo />
            <span className="text-xl font-bold text-text-primary">Expenses</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="/app"
              className="text-text-secondary hover:text-accent transition-colors duration-200"
            >
              Sign In
            </a>
            <button
              onClick={() => scrollToSection('features')}
              className="text-text-secondary hover:text-accent transition-colors duration-200"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-text-secondary hover:text-accent transition-colors duration-200"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-text-secondary hover:text-accent transition-colors duration-200"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="bg-accent text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity duration-200"
            >
              Get Demo
            </button>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-lg hover:bg-gray-200/50 transition-colors duration-200"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200/80">
            <nav className="flex flex-col space-y-4">
              <a
                href="/app"
                className="text-left text-text-secondary hover:text-accent transition-colors duration-200"
              >
                Sign In
              </a>
              <button
                onClick={() => scrollToSection('features')}
                className="text-left text-text-secondary hover:text-accent transition-colors duration-200"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-left text-text-secondary hover:text-accent transition-colors duration-200"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-left text-text-secondary hover:text-accent transition-colors duration-200"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-left bg-accent text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity duration-200 w-fit"
              >
                Get Demo
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;