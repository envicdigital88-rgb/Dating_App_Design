import React from 'react';
import { CheckCircle2Icon } from 'lucide-react';
import { cn } from '@/lib/utils/format';

export function Badge({
  children,
  tone = 'neutral',
  className




}: {children: React.ReactNode;tone?: 'neutral' | 'berry' | 'moss' | 'amber' | 'red' | 'plum';className?: string;}) {
  const tones = {
    neutral: 'bg-cream-deep text-ink-soft',
    berry: 'bg-berry-100 text-berry-600',
    moss: 'bg-moss/10 text-moss',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-700',
    plum: 'bg-plum-500 text-cream'
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]',
        tones[tone],
        className
      )}>
      
      {children}
    </span>);

}

export function VerifiedMark({ className }: {className?: string;}) {
  return (
    <span title="Verified member" className={cn('inline-flex text-moss', className)}>
      <CheckCircle2Icon className="h-4 w-4" aria-label="Verified member" />
    </span>);

}

export function Skeleton({ className }: {className?: string;}) {
  return <div className={cn('animate-pulse rounded-2xl bg-cream-deep', className)} />;
}

export function EmptyState({
  icon,
  title,
  body,
  action





}: {icon: React.ReactNode;title: string;body: string;action?: React.ReactNode;}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-4xl border border-dashed border-sand bg-white/60 px-8 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-berry-50 text-berry-500">
        {icon}
      </div>
      <h3 className="font-display text-xl text-ink">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>);

}

export function Avatar({
  src,
  name,
  size = 44,
  online





}: {src?: string;name: string;size?: number;online?: boolean;}) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {src ?
      <img
        src={src}
        alt={name}
        className="h-full w-full rounded-full object-cover"
        loading="lazy" /> :


      <div className="flex h-full w-full items-center justify-center rounded-full bg-berry-100 font-display text-berry-600">
          {name.slice(0, 1)}
        </div>
      }
      {online &&
      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-moss" />
      }
    </div>);

}

export function SectionHeading({
  overline,
  title,
  body,
  align = 'center'





}: {overline?: string;title: string;body?: string;align?: 'center' | 'left';}) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      {overline && <p className="mb-3 text-[13px] font-semibold text-berry-500">{overline}</p>}
      <h2 className="font-display text-3xl leading-[1.1] text-ink sm:text-4xl">{title}</h2>
      {body && <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">{body}</p>}
    </div>);

}