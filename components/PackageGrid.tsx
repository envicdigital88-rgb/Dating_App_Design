import React from 'react';
import { CheckIcon, SparklesIcon } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Bits';
import { money } from '@/lib/utils/format';
import type { Package } from '@/lib/types';

export function PackageGrid({
  packages,
  currentPackageId,
  onSelect,
  ctaLabel = 'Choose'





}: {packages: Package[];currentPackageId?: string;onSelect: (pkg: Package) => void;ctaLabel?: string;}) {
  const sorted = [...packages].filter((p) => p.active).sort((a, b) => a.price - b.price);

  return (
    <ul className="grid items-stretch gap-5 lg:grid-cols-3">
      {sorted.map((pkg) => {
        const featured = pkg.priorityVisibility;
        const current = pkg.id === currentPackageId;
        return (
          <li
            key={pkg.id}
            className={`flex flex-col rounded-4xl p-6 shadow-card ${
            featured ? 'bg-plum-500 text-cream' : 'bg-cream-deep text-ink'}`
            }>
            
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className={`font-display text-2xl ${featured ? 'text-cream' : 'text-ink'}`}>
                  {pkg.name}
                </h3>
                <p
                  className={`mt-1.5 text-[13px] leading-relaxed ${
                  featured ? 'text-cream/75' : 'text-ink-soft'}`
                  }>
                  
                  {pkg.tagline}
                </p>
              </div>
              {featured &&
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream/15 text-cream">
                  <SparklesIcon className="h-4 w-4" />
                </span>
              }
              {current && !featured && <Badge tone="moss">Current</Badge>}
            </div>

            <p className="mt-6 flex items-baseline gap-1.5">
              <span className={`font-display text-[40px] leading-none ${featured ? 'text-cream' : 'text-ink'}`}>
                {money(pkg.price)}
              </span>
              {pkg.price > 0 &&
              <span className={`text-[13px] ${featured ? 'text-cream/70' : 'text-ink-muted'}`}>
                  / {pkg.durationDays} days
                </span>
              }
            </p>

            <dl className={`mt-6 space-y-2 border-y py-5 text-[13px] ${featured ? 'border-cream/15' : 'border-sand'}`}>
              <div className="flex justify-between gap-3">
                <dt className={featured ? 'text-cream/70' : 'text-ink-muted'}>Chat messages</dt>
                <dd className="font-medium">{pkg.chatLimit === null ? 'Unlimited' : pkg.chatLimit}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className={featured ? 'text-cream/70' : 'text-ink-muted'}>Dating requests</dt>
                <dd className="font-medium">
                  {pkg.requestLimit === null ? 'Unlimited' : pkg.requestLimit}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className={featured ? 'text-cream/70' : 'text-ink-muted'}>Incoming requests</dt>
                <dd className="font-medium">{pkg.incomingRequestsUnlocked ? 'Revealed' : 'Locked'}</dd>
              </div>
            </dl>

            <ul className="mt-5 space-y-2.5">
              {pkg.features.map((f) =>
              <li key={f} className="flex gap-2.5 text-[14px] leading-snug">
                  <CheckIcon
                  className={`mt-0.5 h-4 w-4 shrink-0 ${featured ? 'text-cream/80' : 'text-moss'}`} />
                
                  <span className={featured ? 'text-cream/90' : 'text-ink-soft'}>{f}</span>
                </li>
              )}
            </ul>

            <div className="mt-8 pt-1">
              <Button
                block
                size="md"
                variant={featured ? 'inverse' : pkg.price === 0 ? 'outline' : 'secondary'}
                disabled={current}
                onClick={() => onSelect(pkg)}>
                
                {current ? 'Your current package' : pkg.price === 0 ? 'Start free' : `${ctaLabel} ${pkg.name}`}
              </Button>
            </div>
          </li>);

      })}
    </ul>);

}
