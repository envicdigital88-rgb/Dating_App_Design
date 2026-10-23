'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/contexts/StoreContext';
import { SiteNav } from '@/components/landing/SiteNav';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { SecretWingleSection } from '@/components/landing/SecretWingleSection';
import { DiscoverPreview } from '@/components/landing/DiscoverPreview';
import { WinglesShowcase } from '@/components/landing/WinglesShowcase';
import { Safety } from '@/components/landing/Safety';
import { Testimonials } from '@/components/landing/Testimonials';
import { Faq } from '@/components/landing/Faq';
import { InstallSection } from '@/components/landing/InstallSection';
import { SiteFooter } from '@/components/landing/SiteFooter';

export function LandingView() {
  const { currentUser, isHydrated } = useStore();
  const router = useRouter();
  const [hasLocalSession, setHasLocalSession] = useState(() => {
    if (typeof window !== 'undefined') {
      const isPreview = window.location.search.includes('preview=true');
      return !isPreview && !!localStorage.getItem('winglemingle_session');
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isPreview = window.location.search.includes('preview=true');
      const session = localStorage.getItem('winglemingle_session');
      if (session && !isPreview) {
        setHasLocalSession(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    // Allow intentional preview mode if specified in search query (?preview=true)
    if (typeof window !== 'undefined' && window.location.search.includes('preview=true')) {
      return;
    }

    if (currentUser && !currentUser.suspended) {
      if (!currentUser.verified) {
        router.replace('/verify-phone');
      } else if (currentUser.role === 'admin') {
        router.replace('/admin');
      } else if (!currentUser.onboarded) {
        router.replace('/onboarding');
      } else {
        router.replace('/discover');
      }
    } else {
      // User is confirmed not signed in
      setHasLocalSession(false);
    }
  }, [currentUser, isHydrated, router]);

  // If already logged in, show smooth splash loader instead of flashing the landing page
  if (hasLocalSession || (isHydrated && currentUser && !currentUser.suspended)) {
    return (
      <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-24 w-24 animate-ping rounded-full bg-berry-500/20" />
          <img src="/logo.png" alt="Loading..." className="relative z-10 h-16 w-16 animate-pulse object-contain" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full bg-black">
      <SiteNav />
      <main>
        <Hero />
        <HowItWorks />
        <SecretWingleSection />
        <DiscoverPreview />
        <WinglesShowcase />
        <Safety />
        <Testimonials />
        <Faq />
        <div id="install">
          <InstallSection />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
