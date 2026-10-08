'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-[#07061a] text-ink selection:bg-berry-500/30 relative overflow-hidden font-sans">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#8b2fc9] opacity-35 blur-[100px]" />
        <div className="absolute -bottom-32 right-0 h-[350px] w-[350px] rounded-full bg-[#0ea5e9] opacity-25 blur-[90px]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ec4899] opacity-10 blur-[80px]" />
      </div>

      <div className="pointer-events-none absolute -right-16 top-1/2 -translate-y-1/2 select-none opacity-[0.06]">
        <img src="/logo.png" alt="" width={380} height={380} className="object-contain" />
      </div>

      <div className="mx-auto max-w-4xl px-5 py-12 md:py-20 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <div className="flex flex-col-reverse items-center sm:flex-row sm:items-center justify-between gap-6 mb-12">
            <Link href="/" className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-ink-soft transition-all duration-300 hover:bg-white/10 hover:text-ink hover:border-white/20 sm:self-auto">
              <ArrowLeftIcon className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
              Back to Home
            </Link>
            <BrandMark size={56} className="opacity-90 transition-opacity hover:opacity-100" />
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-3xl p-8 md:p-14 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none" />
            <div className="relative z-10">
              <h1 className="font-display text-4xl md:text-5xl font-bold bg-gradient-to-br from-berry-300 via-plum-300 to-indigo-300 bg-clip-text text-transparent mb-12 tracking-tight text-center sm:text-left">
                Community Guidelines
              </h1>
              
              <div className="space-y-12 text-[16px] leading-relaxed text-ink-soft/90">
                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    Welcome to WingleMingle
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">
                      WingleMingle is a place to meet people, start conversations, make connections and see where things go.
                    </p>
                    <p className="mb-4">
                      Our community works best when everyone treats each other with respect.
                    </p>
                    <p>
                      By using WingleMingle, you agree to follow these Community Guidelines.
                    </p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    1. Be respectful
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">
                      Treat other people with basic respect.
                    </p>
                    <p>
                      You don't have to like everyone you meet, but you must communicate without bullying, harassment, intimidation or abuse.
                    </p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    2. No harassment
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">
                      Do not repeatedly contact someone who has made it clear that they do not want to communicate with you.
                    </p>
                    <p className="mb-2">Do not:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Threaten people</li>
                      <li>Intimidate people</li>
                      <li>Bully people</li>
                      <li>Stalk people</li>
                      <li>Humiliate people</li>
                      <li>Encourage others to harass someone</li>
                      <li>Create accounts to continue contacting someone who has blocked you</li>
                    </ul>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    3. Be honest about who you are
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">
                      Do not impersonate another person.
                    </p>
                    <p className="mb-4">
                      Do not create an account using someone else's photographs, identity or personal information without permission.
                    </p>
                    <p>
                      Do not deliberately mislead people about who you are for the purpose of deceiving, manipulating or exploiting them.
                    </p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    4. No scams or financial exploitation
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-2">Do not use WingleMingle to:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Scam people</li>
                      <li>Request money through deceptive stories</li>
                      <li>Promote fraudulent investments</li>
                      <li>Promote pyramid or Ponzi schemes</li>
                      <li>Sell stolen or fraudulent goods</li>
                      <li>Obtain banking information</li>
                      <li>Obtain passwords or verification codes</li>
                      <li>Facilitate financial fraud</li>
                    </ul>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    5. Keep content appropriate
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-2">Do not upload or send content that is:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Threatening</li>
                      <li>Abusive</li>
                      <li>Extremely violent</li>
                      <li>Sexually exploitative</li>
                      <li>Illegal</li>
                      <li>Designed to harass or intimidate another person</li>
                    </ul>
                    <p>
                      Do not use WingleMingle to distribute intimate images of another person without their permission.
                    </p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    6. Respect boundaries
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">
                      A connection, Wingle or conversation does not mean that another person owes you anything.
                    </p>
                    <p>
                      If someone says no, stops responding, blocks you or asks you to stop contacting them, respect their decision.
                    </p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    7. Use Secret Wingle responsibly
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">
                      Secret Wingle is intended for fun, respectful anonymous crush messages.
                    </p>
                    <p className="mb-4">
                      Do not use it to harass, threaten, stalk, intimidate or repeatedly contact someone against their wishes.
                    </p>
                    <p>
                      We may restrict or remove access to Secret Wingle if it is abused.
                    </p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    8. Don't spam
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-2">Do not use WingleMingle to send:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Bulk unsolicited messages</li>
                      <li>Repetitive promotional content</li>
                      <li>Automated spam</li>
                      <li>Malicious links</li>
                      <li>Fake engagement</li>
                      <li>Unwanted advertising</li>
                    </ul>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    9. No illegal activity
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p>
                      You must not use WingleMingle to plan, promote or participate in illegal activity.
                    </p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    10. Protect other people's privacy
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-2">Do not publish another person's:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Phone number</li>
                      <li>Home address</li>
                      <li>Private messages</li>
                      <li>Identification documents</li>
                      <li>Private photographs</li>
                      <li>Financial information</li>
                      <li>Other confidential information</li>
                    </ul>
                    <p>
                      without their permission.
                    </p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    11. Don't manipulate or exploit people
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p>
                      Do not deliberately manipulate another user for financial, sexual, emotional or other personal gain.
                    </p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    12. Report problems
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">
                      If you see behaviour that violates these guidelines, report it.
                    </p>
                    <p>
                      You can report a profile or other inappropriate activity through our reporting tools.
                    </p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    Enforcement
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">
                      When we receive a report or identify potentially harmful behaviour, we may investigate.
                    </p>
                    <p className="mb-2">Depending on the circumstances, we may:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Remove content</li>
                      <li>Restrict certain features</li>
                      <li>Remove Wingits associated with fraudulent activity</li>
                      <li>Warn the user</li>
                      <li>Temporarily suspend an account</li>
                      <li>Permanently terminate an account</li>
                      <li>Cooperate with lawful requests from authorities where required</li>
                    </ul>
                    <p>
                      We may take action even if the behaviour does not fit perfectly into one of the examples above.
                    </p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    No retaliation
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p>
                      Do not retaliate against someone because they reported you or because they blocked you.
                    </p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    Our goal
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">
                      We want WingleMingle to be a place where people can say:
                    </p>
                    <p className="mb-4 italic text-ink-soft">
                      "I met someone interesting."
                    </p>
                    <p className="mb-4">
                      Not:
                    </p>
                    <p className="mb-4 italic text-ink-soft">
                      "I wish I had never joined."
                    </p>
                    <p className="font-medium text-berry-300">
                      Be genuine. Be respectful. Have fun.
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
