'use client';

import React, { useEffect } from 'react';
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

  useEffect(() => {
    if (!isHydrated || !currentUser || currentUser.suspended) return;

    // Allow intentional preview mode if specified in search query (?preview=true)
    if (typeof window !== 'undefined' && window.location.search.includes('preview=true')) {
      return;
    }

    if (currentUser.role === 'admin') {
      const saved = localStorage.getItem('winglemingle_last_path');
      router.replace(saved && saved.startsWith('/admin') ? saved : '/admin');
    } else if (!currentUser.onboarded) {
      router.replace('/onboarding');
    } else {
      const saved = localStorage.getItem('winglemingle_last_path');
      const validSaved = saved && !saved.startsWith('/admin') && !saved.startsWith('/sign-') && saved !== '/';
      router.replace(validSaved ? saved : '/discover');
    }
  }, [currentUser, isHydrated, router]);

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
