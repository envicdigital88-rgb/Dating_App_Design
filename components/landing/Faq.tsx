import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PlusIcon } from 'lucide-react';
import { SectionHeading } from '../ui/Bits';
import Link from 'next/link';

const landingFaqs = [
  {
    q: "Is WingleMingle free?",
    a: "Yes! Joining WingleMingle is completely free. When you create your account, you'll receive 20 free Wingits, and you'll receive 1 free Wingit every day you login just for coming back. You can purchase additional Wingits whenever you need them, starting from just LKR 100."
  },
  {
    q: "What are Wingits?",
    a: "Wingits are WingleMingle's virtual currency. You can use Wingits for different features and interactions within WingleMingle, such as viewing certain requests, unlocking additional photos and other services. You can earn some Wingits for free or purchase more when you run out."
  },
  {
    q: "How many Wingits do I get?",
    a: "Every new member receives 20 free Wingits when they join WingleMingle. You'll also receive 1 free Wingit every day."
  },
  {
    q: "What is a Wingle?",
    a: "A Wingle is your way of showing someone that you'd like to connect. See someone interesting? Send them a Wingle and let them decide where it goes. A Wingle can be the beginning of a conversation, a friendship, a date  or something completely unexpected."
  },
  {
    q: "What is a Secret Wingle?",
    a: "Secret Wingle is for the brave... and the curious. Have a crush on someone but don't want to reveal yourself straight away? Send them a Secret Wingle. They'll know that someone has a crush on them, but they won't know who sent it. If they choose to respond, you can start an anonymous conversation, exchange hints and decide later whether you want to reveal yourselves. Sometimes a little mystery is where the story begins."
  },
  {
    q: "Do I need a subscription?",
    a: "No. WingleMingle does not require a subscription to join. You can use the platform for free, receive free Wingits and purchase additional Wingits whenever you want to access more features. Membership and subscription options may be introduced in the future."
  },
  {
    q: "What happens when I run out of Wingits?",
    a: "Don't worry! You can continue using the parts of WingleMingle that don't require Wingits. When you need more, you can purchase additional Wingits starting from LKR 100."
  },
  {
    q: "Is WingleMingle a dating app?",
    a: "WingleMingle is more than just dating. You can use it to meet people, make friends, start conversations, find dates and discover genuine connections. What your Wingle becomes is up to you."
  },
  {
    q: "Is WingleMingle available as an app?",
    a: "WingleMingle currently works as a Progressive Web App (PWA). You can use it directly from your browser and install it on your phone's home screen for an app-like experience without needing to download it from an app store. A dedicated iOS and Android app may come in the future."
  },
  {
    q: "Is my information safe?",
    a: "We take privacy and safety seriously. WingleMingle includes tools such as blocking, reporting and profile/photo moderation to help keep the community safer. Never share passwords, financial information or other sensitive personal information with another member."
  }
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="border-b border-sand/60 bg-cream-deep/50 py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <SectionHeading overline="Questions" title="The things people ask before joining" />

        <dl className="mt-10 divide-y divide-sand border-y border-sand">
          {landingFaqs.map((faq, i) => {
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
                  {isOpen && (
                    <motion.dd
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
                      className="overflow-hidden">
                      <p className="pb-5 pr-10 text-[15px] leading-relaxed text-ink-soft">{faq.a}</p>
                    </motion.dd>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </dl>

        <div className="mt-10 flex justify-center">
          <Link
            href="/faq"
            className="inline-flex h-12 items-center justify-center rounded-full bg-berry-500 px-8 text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-berry-600 active:scale-[0.98]"
          >
            View all Frequently Asked Questions
          </Link>
        </div>
      </div>
    </section>
  );
}