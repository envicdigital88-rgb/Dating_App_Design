'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/contexts/StoreContext';
import { AdminShell } from '@/components/views/admin/AdminShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.replace('/sign-in');
    } else if (currentUser.role !== 'admin') {
      router.replace('/discover');
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.role !== 'admin') {
    return null; // Or a loading spinner
  }

  return (
    <AdminShell>
      {children}
    </AdminShell>
  );
}
