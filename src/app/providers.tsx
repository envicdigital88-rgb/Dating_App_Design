'use client';

import { StoreProvider } from '../contexts/StoreContext';
import { PwaProvider } from '../components/PwaProvider';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <PwaProvider>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: '999px',
              border: '1px solid #e8ddd2',
              background: '#ffffff',
              color: '#1d1420',
              fontFamily: 'Inter, system-ui, sans-serif'
            }
          }} />
      </PwaProvider>
    </StoreProvider>
  );
}
