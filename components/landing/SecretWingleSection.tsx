import React from 'react';
import { LockIcon, HeartIcon, SmartphoneIcon } from 'lucide-react';
import { SectionHeading } from '../ui/Bits';

export function SecretWingleSection() {
  return (
    <section id="secret-wingle" className="border-b border-sand/60 py-16 lg:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2 lg:gap-20 lg:px-8">
        <div className="order-2 space-y-4 lg:order-1">
          <div className="rounded-4xl bg-cream-deep p-5 shadow-card">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
              Anonymous Message
            </p>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-berry-500/10 text-berry-500">
                <LockIcon className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg leading-tight text-ink">Someone likes you! 🤫</p>
                <p className="mt-1 text-[13px] text-ink-soft">"I've had a crush on you for a while..."</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-4xl border border-sand bg-cream-deep/60 px-5 py-4 text-[13px] text-ink-soft">
            <SmartphoneIcon className="h-4 w-4 shrink-0 text-ink-muted" />
            They'll see it as soon as they sign up with their phone number.
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <SectionHeading
            align="responsive"
            overline="Secret Wingle"
            title="Have a secret crush?"
            body="Send them an anonymous message. If they ever join Wingle Mingle with their phone number, your message will be waiting for them."
          />
          
          <ul className="mt-8 space-y-4">
            {[
              'Send anonymously without revealing yourself yet',
              'Only visible when they join the app',
              'Costs 20 Wingits to send'
            ].map((point) => (
              <li key={point} className="flex gap-3 text-[15px] leading-relaxed text-ink-soft">
                <HeartIcon className="mt-0.5 h-4 w-4 shrink-0 text-berry-500" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
