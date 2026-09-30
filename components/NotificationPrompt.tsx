'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';

import { usePwa } from '@/components/PwaProvider';
import { Download } from 'lucide-react';

export function NotificationPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const { installable, promptInstall } = usePwa();
  const [needsNotification, setNeedsNotification] = useState(false);

  useEffect(() => {
    let show = false;
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        setNeedsNotification(true);
        show = true;
      }
    }
    
    // Check if installable (from usePwa)
    if (installable) {
      show = true;
    }

    if (show) {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [installable]);

  const handleAction = async () => {
    setIsVisible(false);
    
    if (installable) {
      promptInstall();
    }
    
    if (needsNotification) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted' && 'serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          const urlBase64ToUint8Array = (base64String: string) => {
            const padding = '='.repeat((4 - base64String.length % 4) % 4);
            const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; ++i) {
              outputArray[i] = rawData.charCodeAt(i);
            }
            return outputArray;
          };

          const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (publicKey) {
            const sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(publicKey)
            });
            const { savePushSubscriptionAction } = await import('@/app/actions/push');
            await savePushSubscriptionAction(sub.toJSON());
          }
        }
      } catch (err) {
        console.error('Failed to enable notifications:', err);
      }
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed bottom-24 left-4 right-4 z-50 md:bottom-8 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-96"
      >
        <div className="bg-card text-card-foreground backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-berry-400 to-plum-400"></div>
          
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-berry-100 dark:bg-berry-900/30 flex items-center justify-center text-berry-600 dark:text-berry-400 shadow-sm border border-berry-200 dark:border-berry-800">
              {installable ? (
                <Download className="w-6 h-6 animate-bounce" style={{ animationDuration: '2s' }} />
              ) : (
                <Bell className="w-6 h-6 animate-bounce" style={{ animationDuration: '2s' }} />
              )}
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg mb-1">
                {installable ? 'Install App & Get Notified' : 'Turn on Notifications'}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                {installable 
                  ? 'Add Wingle Mingle to your home screen for the best experience and never miss a match.'
                  : 'Never miss a message or a new match! Enable notifications to stay connected.'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleAction}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-95 text-sm"
                >
                  {installable ? 'Install Now' : 'Enable Now'}
                </button>
                <button
                  onClick={() => setIsVisible(false)}
                  className="px-4 py-2.5 rounded-xl font-medium text-muted-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors text-sm"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
