import React from 'react';
import { cn } from '../utils/format';

export function UsageMeter({
  label,
  used,
  limit,
  tone = 'berry'





}: {label: string;used: number;limit: number | null;tone?: 'berry' | 'plum';}) {
  const unlimited = limit === null;
  const remaining = unlimited ? null : Math.max(0, limit - used);
  const pct = unlimited ? 100 : limit === 0 ? 0 : Math.max(0, Math.min(100, remaining! / limit * 100));
  const low = !unlimited && remaining! <= Math.max(1, Math.round((limit || 1) * 0.15));

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] text-ink-soft">{label}</span>
        <span
          className={cn(
            'font-display text-[15px]',
            low ? 'text-berry-500' : tone === 'plum' ? 'text-cream' : 'text-ink'
          )}>
          
          {unlimited ? 'Unlimited' : remaining}
        </span>
      </div>
      <div
        className={cn('mt-2 h-1.5 w-full overflow-hidden rounded-full', tone === 'plum' ? 'bg-cream/20' : 'bg-cream-deep')}
        role="progressbar"
        aria-valuenow={unlimited ? 100 : remaining ?? 0}
        aria-valuemin={0}
        aria-valuemax={unlimited ? 100 : limit ?? 0}
        aria-label={label}>
        
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-300 ease-soft',
            low ? 'bg-berry-500' : tone === 'plum' ? 'bg-cream' : 'bg-moss'
          )}
          style={{ width: `${pct}%` }} />
        
      </div>
    </div>);

}