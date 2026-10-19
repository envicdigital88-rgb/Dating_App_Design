'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface PwaValue {
  installable: boolean;
  installed: boolean;
  offline: boolean;
  promptInstall: () => void;
  dismissInstall: () => void;
  notificationsEnabled: boolean;
  enableNotifications: () => Promise<void>;
}

const PwaContext = createContext<PwaValue | null>(null);

export function PwaProvider({ children }: {children: React.ReactNode;}) {
  const [installable, setInstallable] = useState(true);
  const [installed, setInstalled] = useState(false);
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<{prompt: () => Promise<void>;} | null>(null);

  useEffect(() => {
    // Register Service Worker immediately on mount for PWA installability and background push
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Service Worker registration failed:', err);
      });
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as {prompt: () => Promise<void>;});
      setInstallable(true);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallable(false);
    };
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setInstalled(true);
      setInstallable(false);
    }

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const value = useMemo<PwaValue>(
    () => ({
      installable: installable && !installed,
      installed,
      offline,
      promptInstall: () => {
        deferredPrompt?.prompt().catch(() => undefined);
      },
      dismissInstall: () => setInstallable(false),
      notificationsEnabled,
      enableNotifications: async () => {
        if (typeof Notification === 'undefined') {
          toast.info('Notifications are not supported on this browser');
          return;
        }
        try {
          const permission = await window.Notification.requestPermission();
          setNotificationsEnabled(permission === 'granted');
          if (permission === 'granted' && 'serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (publicKey) {
              const padding = '='.repeat((4 - publicKey.length % 4) % 4);
              const base64 = (publicKey + padding).replace(/\-/g, '+').replace(/_/g, '/');
              const rawData = window.atob(base64);
              const outputArray = new Uint8Array(rawData.length);
              for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
              }
              const newSub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: outputArray
              });
              const { savePushSubscriptionAction } = await import('@/app/actions/push');
              await savePushSubscriptionAction(newSub.toJSON());
              toast.success('Push notifications enabled!');
            }
          } else if (permission === 'denied') {
            toast.error('Notifications were blocked. Please enable them in your browser settings.');
          }
        } catch (e) {
          console.error('Error enabling notifications:', e);
          toast.error('Failed to enable push notifications');
        }
      }
    }),
    [deferredPrompt, installable, installed, notificationsEnabled, offline]
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa() {
  const ctx = useContext(PwaContext);
  if (!ctx) throw new Error('usePwa must be used inside PwaProvider');
  return ctx;
}