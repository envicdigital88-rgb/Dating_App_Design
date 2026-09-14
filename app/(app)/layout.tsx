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
    return null; // Or a loading spinner
  }

  return (
    <AppShell>
      {children}
    </AppShell>
  );
}
