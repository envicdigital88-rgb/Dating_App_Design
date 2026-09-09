import React from 'react';
import { SectionHeading } from '../ui/Bits';
import { testimonials } from '@/lib/data/seed';

export function Testimonials() {
  const [lead, ...rest] = testimonials;

  return (
    <section className="border-b border-sand/60 py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <SectionHeading
          overline="From our members"
          title="What people say once they have actually met someone" />
        

        <div className="mt-12 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <figure className="flex flex-col justify-between rounded-4xl bg-white p-8 shadow-card lg:p-10">
            <blockquote className="font-display text-[26px] leading-[1.25] text-ink lg:text-[32px]">
              “{lead.quote}”
            </blockquote>
            <figcaption className="mt-8 text-[14px]">
              <span className="block font-medium text-ink">{lead.name}</span>
              <span className="block text-ink-muted">{lead.detail}</span>
            </figcaption>
          </figure>

          <div className="grid gap-5">
            {rest.map((t) =>
            <figure key={t.name} className="flex flex-col justify-between rounded-4xl bg-cream-deep/70 p-6">
                <blockquote className="text-[15px] leading-relaxed text-ink-soft">“{t.quote}”</blockquote>
                <figcaption className="mt-5 text-[13px]">
                  <span className="block font-medium text-ink">{t.name}</span>
                  <span className="block text-ink-muted">{t.detail}</span>
                </figcaption>
              </figure>
            )}
          </div>
        </div>
      </div>
    </section>);

}