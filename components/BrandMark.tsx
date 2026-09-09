import React from 'react';
import { cn } from '@/lib/utils/format';

export function BrandMark({
  className,
  tone = 'ink'



}: {className?: string;tone?: 'ink' | 'cream';}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-xl',
          tone === 'cream' ? 'bg-cream text-plum-500' : 'bg-berry-500 text-white'
        )}
        aria-hidden>
        
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M12 21s-7.5-4.7-9.3-9.1C1.2 8.3 3.3 5 6.7 5c2 0 3.5 1 4.3 2.4C11.8 6 13.3 5 15.3 5c3.4 0 5.5 3.3 4 6.9C17.5 16.3 12 21 12 21Z" />
        </svg>
      </span>
      <span
        className={cn(
          'font-display text-[21px] tracking-[-0.02em]',
          tone === 'cream' ? 'text-cream' : 'text-ink'
        )}>
        
        Kindred
      </span>
    </span>);

}