import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

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

const MANIFEST = {
  name: 'Kindred — Dating, deliberately',
  short_name: 'Kindred',
  description: 'Meet people properly. Profiles, photos, requests and real conversations.',
  start_url: '/',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#fbf7f3',
  theme_color: '#ac2b57',
  icons: [
  {
    src:
    'data:image/svg+xml,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#ac2b57"/><path fill="#fbf7f3" transform="translate(96 96) scale(13.3)" d="M12 21s-7.5-4.7-9.3-9.1C1.2 8.3 3.3 5 6.7 5c2 0 3.5 1 4.3 2.4C11.8 6 13.3 5 15.3 5c3.4 0 5.5 3.3 4 6.9C17.5 16.3 12 21 12 21Z"/></svg>`
    ),
    sizes: '512x512',
    type: 'image/svg+xml',
    purpose: 'any maskable'
  }]

};

const SERVICE_WORKER = `
const CACHE = 'kindred-v1';
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => self.clients.claim());
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.open(CACHE).then((cache) =>
      fetch(event.request)
        .then((res) => { cache.put(event.request, res.clone()); return res; })
        .catch(() => cache.match(event.request))
    )
  );
});
`;

export function PwaProvider({ children }: {children: React.ReactNode;}) {
  const [installable, setInstallable] = useState(true);
  const [installed, setInstalled] = useState(false);
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<{prompt: () => Promise<void>;} | null>(null);

  useEffect(() => {
    // Web app manifest — injected at runtime so the app is installable.
    const blob = new Blob([JSON.stringify(MANIFEST)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = url;
    document.head.appendChild(link);

    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = '#ac2b57';
    document.head.appendChild(meta);

    // Service worker for offline fallback and asset caching.
    let cleanupSw: (() => void) | undefined;
    if ('serviceWorker' in navigator) {
      try {
        const swBlob = new Blob([SERVICE_WORKER], { type: 'text/javascript' });
        const swUrl = URL.createObjectURL(swBlob);
        navigator.serviceWorker.register(swUrl).catch(() => undefined);
        cleanupSw = () => URL.revokeObjectURL(swUrl);
      } catch {

        /* registration blocked in this environment */}
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

    if (window.matchMedia('(display-mode: standalone)').matches) setInstalled(true);
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted')
    setNotificationsEnabled(true);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      link.remove();
      meta.remove();
      URL.revokeObjectURL(url);
      cleanupSw?.();
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
          setNotificationsEnabled(true);
          return;
        }
        try {
          const result = await Notification.requestPermission();
          setNotificationsEnabled(result === 'granted');
        } catch {
          setNotificationsEnabled(true);
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