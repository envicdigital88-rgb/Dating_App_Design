import React from 'react';
import { CheckIcon, ClockIcon, LockIcon } from 'lucide-react';
import { SectionHeading } from '../ui/Bits';
import { seedPhotos } from '@/lib/data/seed';

const blurred = seedPhotos.find((p) => p.userId === 'u-7')?.url;
const accepted = seedPhotos.find((p) => p.userId === 'u-1' && p.isPrimary)?.url;

export function RequestsShowcase() {
  return (
    <section id="requests" className="border-b border-sand/60 py-16 lg:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2 lg:gap-20 lg:px-8">
        <div>
          <SectionHeading
            align="left"
            overline="Dating requests"
            title="Interest you can see, and interest you unlock"
            body="Requests you send are always visible to you, with their status. Requests you receive are a paid feature — you will know someone is there, and one upgrade reveals who." />
          
          <ul className="mt-8 space-y-4">
            {[
            'Send a request with a note — no more shouting into a void',
            'Track pending, accepted and declined in one place',
            'Incoming requests stay anonymous until you upgrade',
            'Accepting a request opens a conversation instantly'].
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
              Incoming · locked
            </p>
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-cream-deep">
                {blurred &&
                <img src={blurred} alt="" className="h-full w-full scale-110 object-cover blur-[10px]" />
                }
                <span className="absolute inset-0 flex items-center justify-center bg-plum-500/25 text-white">
                  <LockIcon className="h-4 w-4" />
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-display text-lg leading-tight text-ink">
                  Someone wants to connect ❤
                </p>
                <p className="mt-1 text-[13px] text-ink-soft">
                  Upgrade your package to see who sent this request.
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-cream px-4 py-3 text-[13px] text-ink-muted">
              “Your bio made me laugh. ▒▒▒▒▒▒ sometime?”
            </div>
          </div>

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
            Requests expire quietly after 30 days, so nobody is left waiting on a maybe.
          </div>
        </div>
      </div>
    </section>);

}
