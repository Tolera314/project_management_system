'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from './components/landing/Navbar';
import HeroSection from './components/landing/HeroSection';
import FeaturesSection from './components/landing/FeaturesSection';
import DemoSection from './components/landing/DemoSection';
import TemplatesSection from './components/landing/TemplatesSection';
import FlexibleTaskSection from './components/landing/FlexibleTaskSection';
import CollaborationSection from './components/landing/CollaborationSection';
import ProgressSection from './components/landing/ProgressSection';
import InsightsSection from './components/landing/InsightsSection';
import SecuritySection from './components/landing/SecuritySection';
import CTASection from './components/landing/CTASection';
import Footer from './components/landing/Footer';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      router.replace('/dashboard');
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <DemoSection />
      <FlexibleTaskSection />
      <TemplatesSection />
      <CollaborationSection />
      <ProgressSection />
      <InsightsSection />
      <SecuritySection />
      <CTASection />
      <Footer />
    </main>
  );
}
