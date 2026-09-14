'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SiteNav } from '@/components/landing/SiteNav';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { DiscoverPreview } from '@/components/landing/DiscoverPreview';
import { WinglesShowcase } from '@/components/landing/WinglesShowcase';
import { Safety } from '@/components/landing/Safety';
import { Testimonials } from '@/components/landing/Testimonials';
import { Faq } from '@/components/landing/Faq';
import { InstallSection } from '@/components/landing/InstallSection';
import { SiteFooter } from '@/components/landing/SiteFooter';
import { PackageGrid } from '@/components/PackageGrid';
import { SectionHeading } from '@/components/ui/Bits';
import { useStore } from '@/lib/contexts/StoreContext';

export default function Landing() {
  const router = useRouter();
  const { db } = useStore();

  return (
    <div className="min-h-full w-full bg-black">
      <SiteNav />
      <main>
        <Hero />
        <HowItWorks />
        <DiscoverPreview />
        <WinglesShowcase />

        {/* <section id="packages" className="border-b border-sand/60 py-16 lg:py-24">
          <div className="mx-auto max-w-6xl px-5 lg:px-8">
            <SectionHeading
              overline="Packages"
              title="Pay for conversations, not for hope"
              body="Start free and see the whole community. Upgrade when you have someone you actually want to talk to — every package includes a mingle allowance held on your account." />
            
            <div className="mt-12">
              <PackageGrid
                packages={db.packages}
                onSelect={() => router.push('/sign-up')}
                ctaLabel="Get" />
              
            </div>
            <p className="mt-6 text-center text-[13px] text-ink-muted">
              Allowances are set by our team and shown live in your dashboard. Cancel any time —
              packages do not auto-renew without your consent.
            </p>
          </div>
        </section> */}

        <Safety />
        <Testimonials />
        <Faq />
        <div id="install">
          <InstallSection />
        </div>
      </main>
      <SiteFooter />
    </div>);
}
