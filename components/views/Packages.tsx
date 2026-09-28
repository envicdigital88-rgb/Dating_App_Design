'use client';

import React, { useState } from 'react';
import { ShieldCheckIcon, CoinsIcon, SparklesIcon } from 'lucide-react';
import { Page, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { useStore } from '@/lib/contexts/StoreContext';
import { faqs } from '@/lib/data/seed';
import { money } from '@/lib/utils/format';

export function Packages() {
  const { entitlements } = useStore();
  const [customAmount, setCustomAmount] = useState<number | ''>('');

  if (!entitlements) return null;

  const handleBuy = (amount: number) => {
    if (amount < 100) return;
    // Just mock routing or alert for now since we don't have a Wingits checkout API
    alert(`Checkout for ${amount} Wingits at ${money(amount)}`);
  };

  const presets = [
    { amount: 100, featured: false, label: 'Starter' },
    { amount: 500, featured: true, label: 'Popular' },
    { amount: 1000, featured: false, label: 'Pro' },
  ];

  return (
    <Page>
      <PageHeader
        title="Buy Wingits"
        body="Wingits are the currency of WingleMingle. 1 Wingit = Rs. 1. Minimum purchase is 100 Wingits." />
      
      <div className="mb-12">
        <ul className="grid items-stretch gap-6 lg:grid-cols-3">
          {presets.map((pkg) => (
            <li
              key={pkg.amount}
              className={`relative flex flex-col rounded-[2rem] p-8 shadow-card transition-transform hover:-translate-y-1 ${
                pkg.featured ? 'bg-gradient-to-br from-plum-500/30 to-berry-500/30 border border-white/10 backdrop-blur-3xl text-ink' : 'bg-cream-deep text-ink border border-transparent'
              }`}>
              <div className="flex items-center justify-between gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${pkg.featured ? 'bg-berry-500/20 text-berry-400' : 'bg-sand/50 text-ink-soft'}`}>
                  <CoinsIcon className="h-6 w-6" />
                </div>
                {pkg.featured && (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white shadow-sm">
                    <SparklesIcon className="h-5 w-5" />
                  </span>
                )}
              </div>
              <div className="mt-5">
                <h3 className="font-display text-2xl font-semibold text-ink whitespace-nowrap">
                  {pkg.amount} Wingits
                </h3>
                <p className={`mt-1.5 text-[14px] leading-relaxed ${pkg.featured ? 'text-ink/90 font-medium' : 'text-ink-soft'}`}>
                  {pkg.label}
                </p>
              </div>
              <div className="mt-8 mb-4">
                <span className="font-display text-[48px] leading-[1.1] text-ink tracking-tight">
                  {money(pkg.amount)}
                </span>
              </div>
              <div className="mt-auto pt-6">
                <Button onClick={() => handleBuy(pkg.amount)} variant={pkg.featured ? 'primary' : 'secondary'} className="w-full py-4 text-base font-medium rounded-2xl">
                  Buy {pkg.amount} Wingits
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-10 rounded-[2rem] bg-cream-deep p-8 shadow-card border border-sand/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-md">
              <h3 className="font-display text-2xl font-semibold text-ink mb-2">Custom Amount</h3>
              <p className="text-[14px] text-ink-soft leading-relaxed">Need a specific number of Wingits? Enter any amount you'd like to buy (minimum 100).</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <CoinsIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" />
                <Input
                  type="number"
                  min="100"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value ? parseInt(e.target.value, 10) : '')}
                  placeholder="e.g. 250"
                  className="pl-12 py-3 text-lg rounded-2xl"
                />
              </div>
              <div className="w-full sm:w-auto">
                <Button 
                  disabled={!customAmount || customAmount < 100} 
                  onClick={() => handleBuy(customAmount as number)} 
                  variant="primary" 
                  className="w-full sm:w-auto px-8 py-3 text-lg rounded-2xl whitespace-nowrap">
                  {customAmount && customAmount >= 100 
                    ? `Buy for ${money(customAmount as number)}` 
                    : 'Enter an amount'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 max-w-3xl">
        <h2 className="flex items-center gap-2 font-display text-xl text-ink">
          <ShieldCheckIcon className="h-4 w-4 text-moss" />
          Before you pay
        </h2>
        <dl className="mt-4 divide-y divide-sand rounded-4xl bg-cream-deep px-5 shadow-card">
          {faqs.slice(0, 3).map((faq) =>
          <div key={faq.q} className="py-4">
              <dt className="font-medium text-ink">{faq.q}</dt>
              <dd className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{faq.a}</dd>
            </div>
          )}
        </dl>
      </div>
    </Page>);

}
