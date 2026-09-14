import React from 'react';
import { CheckIcon, ClockIcon } from 'lucide-react';
import { SectionHeading } from '../ui/Bits';
import { seedPhotos } from '@/lib/data/seed';

const accepted = seedPhotos.find((p) => p.userId === 'u-1' && p.isPrimary)?.url;

export function WinglesShowcase() {
  return (
    <section id="wingles" className="border-b border-sand/60 py-16 lg:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2 lg:gap-20 lg:px-8">
        <div>
          <SectionHeading
            align="responsive"
            overline="Wingling wingles"
            title="Interest you can see, and interest you unlock"
            body="Wingles you send are always visible to you, with their status. Wingles you receive are a paid feature — you will know someone is there, and one upgrade reveals who." />
          
          <ul className="mt-8 space-y-4">
            {[
            'Send a wingle with a note — no more shouting into a void',
            'Track pending, accepted and declined in one place',
            'Accepting a wingle opens a conversation instantly'].
            map((point) =>
            <li key={point} className="flex gap-3 text-[15px] leading-relaxed text-ink-soft">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-moss" />
                {point}
              </li>
            )}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="rounded-4xl bg-cream-deep p-5 shadow-card">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
              Sent · accepted
            </p>
            <div className="flex items-center gap-4">
              {accepted &&
              <img src={accepted} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
              }
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg leading-tight text-ink">Priya, 29</p>
                <p className="mt-1 text-[13px] text-ink-soft">Sent 5 days ago · Shoreditch</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-moss/10 px-3 py-1.5 text-[12px] font-semibold text-moss">
                <CheckIcon className="h-3.5 w-3.5" />
                Accepted
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-4xl border border-sand bg-cream-deep/60 px-5 py-4 text-[13px] text-ink-soft">
            <ClockIcon className="h-4 w-4 shrink-0 text-ink-muted" />
            Wingles expire quietly after 30 days, so nobody is left waiting on a maybe.
          </div>
        </div>
      </div>
    </section>);

}
