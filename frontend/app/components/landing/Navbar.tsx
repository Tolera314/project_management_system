'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/80 border-b border-border backdrop-blur-md' : 'bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
          ProjectOS
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          <Link href="#features" className="text-text-secondary hover:text-text-primary transition-colors">Features</Link>
          <Link href="#workflow" className="text-text-secondary hover:text-text-primary transition-colors">Workflow</Link>
          <Link href="#pricing" className="text-text-secondary hover:text-text-primary transition-colors">Pricing</Link>
          <Link href="/login" className="text-text-primary hover:text-primary transition-colors">Log In</Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-primary/25"
          >
            Get Started Free
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-text-primary" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-surface border-t border-border overflow-hidden"
          >
            <div className="flex flex-col p-6 space-y-4">
              <Link href="#features" className="text-text-secondary hover:text-text-primary" onClick={() => setIsOpen(false)}>Features</Link>
              <Link href="#workflow" className="text-text-secondary hover:text-text-primary" onClick={() => setIsOpen(false)}>Workflow</Link>
              <Link href="#pricing" className="text-text-secondary hover:text-text-primary" onClick={() => setIsOpen(false)}>Pricing</Link>
              <hr className="border-border" />
              <Link href="/login" className="text-text-primary font-medium" onClick={() => setIsOpen(false)}>Log In</Link>
              <Link
                href="/signup"
                className="bg-primary text-white text-center py-3 rounded-lg font-medium"
                onClick={() => setIsOpen(false)}
              >
                Get Started Free
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
