import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PlusIcon } from 'lucide-react';
import { SectionHeading } from '../ui/Bits';
import { faqs } from '../../data/seed';

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="border-b border-sand/60 bg-cream-deep/50 py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <SectionHeading overline="Questions" title="The things people ask before joining" />

        <dl className="mt-10 divide-y divide-sand border-y border-sand">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div key={faq.q}>
                <dt>
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-start justify-between gap-6 py-5 text-left">
                    
                    <span className="font-display text-[19px] leading-snug text-ink">{faq.q}</span>
                    <PlusIcon
                      className={`mt-1 h-4 w-4 shrink-0 text-berry-500 transition-transform duration-200 ease-soft ${
                      isOpen ? 'rotate-45' : ''}`
                      } />
                    
                  </button>
                </dt>
                <AnimatePresence initial={false}>
                  {isOpen &&
                  <motion.dd
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
                    className="overflow-hidden">
                    
                      <p className="pb-5 pr-10 text-[15px] leading-relaxed text-ink-soft">{faq.a}</p>
                    </motion.dd>
                  }
                </AnimatePresence>
              </div>);

          })}
        </dl>
      </div>
    </section>);

}