'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/lib/contexts/StoreContext';
import { AppShell } from '@/components/AppShell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isHydrated } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isHydrated) return;
    if (!currentUser) {
      router.replace(`/sign-in?from=${pathname}`);
    } else if (!currentUser.onboarded) {
      router.replace('/onboarding');
    }
  }, [currentUser, router, pathname, isHydrated]);

  if (!isHydrated || !currentUser || !currentUser.onboarded) {
    return (
      <div className="flex h-screen w-full bg-cream-deep/40">
        <aside className="sticky top-0 hidden h-screen w-[272px] shrink-0 flex-col overflow-y-auto border-r border-sand/70 bg-cream/90 px-5 py-6 lg:flex space-y-4">
           <div className="h-10 w-40 mb-8 mx-auto rounded-full bg-sand animate-pulse" />
           <div className="h-10 w-full rounded-2xl bg-white/50 animate-pulse" />
           <div className="h-10 w-full rounded-2xl bg-white/50 animate-pulse" />
           <div className="h-10 w-full rounded-2xl bg-white/50 animate-pulse" />
           <div className="h-10 w-full rounded-2xl bg-white/50 animate-pulse" />
        </aside>
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-8">
           <div className="relative flex items-center justify-center mb-8">
              <div className="absolute h-24 w-24 animate-ping rounded-full bg-berry-500/20" />
              <img src="/logo.png" alt="Loading..." className="relative z-10 h-12 w-12 animate-pulse object-contain opacity-50" />
           </div>
           <div className="h-8 w-64 rounded-full bg-sand animate-pulse" />
           <div className="h-96 w-full max-w-md rounded-[32px] bg-sand/60 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      {children}
    </AppShell>
  );
}
