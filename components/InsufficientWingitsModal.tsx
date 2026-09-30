'use client';

import React from 'react';
import { Coins, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface InsufficientWingitsModalProps {
  open: boolean;
  onClose: () => void;
  requiredAmount: number;
  currentBalance: number;
  actionName?: string;
}

export function InsufficientWingitsModal({
  open,
  onClose,
  requiredAmount,
  currentBalance,
  actionName = 'complete this action'
}: InsufficientWingitsModalProps) {
  const router = useRouter();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-border relative animate-in zoom-in-95 duration-200">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-100 dark:bg-amber-900/30 text-amber-500 p-3 rounded-full border border-amber-200 dark:border-amber-700/50">
          <AlertCircle className="w-8 h-8" />
        </div>
        
        <div className="mt-6 text-center space-y-3">
          <h2 className="text-2xl font-bold text-foreground">Out of Wingits!</h2>
          
          <p className="text-muted-foreground text-sm leading-relaxed">
            You need <strong className="text-foreground">{requiredAmount} Wingits</strong> to {actionName}, but you only have <strong className="text-amber-500">{currentBalance}</strong> left.
          </p>

          <div className="bg-secondary/30 p-4 rounded-2xl flex items-center justify-center gap-2 text-sm text-foreground/80 mt-4">
            <Coins className="w-5 h-5 text-amber-500" />
            Top up your Wingits to continue!
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Button 
            onClick={() => {
              onClose();
              router.push('/store');
            }} 
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-6 rounded-2xl text-[17px] shadow-lg shadow-amber-500/20"
          >
            Get More Wingits
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full rounded-2xl py-6">
            Maybe Later
          </Button>
        </div>
      </div>
    </div>
  );
}
