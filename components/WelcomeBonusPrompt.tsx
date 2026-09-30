'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CoinsIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/Button';
import { useStore } from '@/lib/contexts/StoreContext';
import { checkWelcomeBonusAction, claimWelcomeBonusAction } from '@/app/actions/wingits';

export function WelcomeBonusPrompt() {
  const { currentUser } = useStore();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only check if user is fully logged in and hydrated
    if (!currentUser) return;

    // Optional: check session storage to not annoy them too much if they click later
    if (sessionStorage.getItem('welcomeBonusDismissed')) return;

    checkWelcomeBonusAction().then((hasClaimed) => {
      if (!hasClaimed) {
        setShow(true);
      }
    }).catch(console.error);
  }, [currentUser]);

  if (!show) return null;

  const handleClaim = async () => {
    setLoading(true);
    const result = await claimWelcomeBonusAction();
    setLoading(false);
    
    if (result.ok) {
      toast.success('You have successfully claimed 20 Free Wingits!');
      setShow(false);
      // Wait a tiny bit then reload to sync the context state, 
      // or we could try to mutate it directly if we had a function for it.
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      toast.error(result.error || 'Failed to claim wingits');
    }
  };

  const handleLater = () => {
    sessionStorage.setItem('welcomeBonusDismissed', 'true');
    setShow(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-cream-deep max-w-sm w-full rounded-[32px] p-6 shadow-2xl relative overflow-hidden text-center"
        >
          {/* Decorative background element */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white shadow-lg mb-5 ring-8 ring-amber-500/20">
              <CoinsIcon className="w-10 h-10" />
            </div>
            
            <h2 className="text-2xl font-display font-bold text-ink mb-2">Claim Your Free Wingits!</h2>
            <p className="text-ink-soft mb-8 text-sm">
              As a welcome gift, we are giving you 20 free Wingits. You can use them to send Secret Wingles to your crushes!
            </p>

            <div className="flex flex-col w-full gap-3">
              <Button onClick={handleClaim} loading={loading} className="w-full h-12 text-base font-bold bg-amber-500 hover:bg-amber-600 text-white border-transparent">
                Claim Now
              </Button>
              <Button onClick={handleLater} variant="ghost" className="w-full h-12 text-ink-muted hover:text-ink">
                Later
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
