'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '../../contexts/StoreContext';
import { AppShell } from '../../components/AppShell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!currentUser) {
      router.replace(`/signin?from=${pathname}`);
    } else if (!currentUser.onboarded) {
      router.replace('/onboarding');
    }
  }, [currentUser, router, pathname]);

  if (!currentUser || !currentUser.onboarded) {
    return null; // Or a loading spinner
  }

  return (
    <AppShell>
      {children}
    </AppShell>
  );
}
