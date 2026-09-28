'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';


export function NotificationPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      // Check if permission is already granted or denied
      if (Notification.permission === 'default') {
        // Show after a slight delay so it doesn't interrupt immediate rendering
        const timer = setTimeout(() => setIsVisible(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleEnable = async () => {
    setIsVisible(false);
    
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Find the service worker and subscribe
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
          await savePushSubscriptionAction(sub);
        }
      }
    } catch (err) {
      console.error('Failed to enable notifications:', err);
    }
  };

  if (!isSupported) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-24 left-4 right-4 z-50 md:bottom-8 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-96"
        >
          <div className="bg-white/90 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-sand/50 rounded-3xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-berry-400 to-blush-400"></div>
            
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-3 right-3 text-mud/40 hover:text-mud transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-berry-100 to-blush-100 flex items-center justify-center text-berry-600 shadow-sm border border-berry-200">
                <Bell className="w-6 h-6 animate-bounce" style={{ animationDuration: '2s' }} />
              </div>
              <div>
                <h3 className="font-bold text-mud text-lg mb-1">Turn on Notifications</h3>
                <p className="text-mud/70 text-sm leading-relaxed mb-4">
                  Never miss a message or a new match! Enable notifications to stay connected.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleEnable}
                    className="flex-1 bg-gradient-to-r from-berry-500 to-blush-500 hover:from-berry-600 hover:to-blush-600 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-95 text-sm"
                  >
                    Enable Now
                  </button>
                  <button
                    onClick={() => setIsVisible(false)}
                    className="px-4 py-2.5 rounded-xl font-medium text-mud/60 hover:bg-sand/30 hover:text-mud transition-colors text-sm"
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
