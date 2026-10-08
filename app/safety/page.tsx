'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';

export default function SafetyCentrePage() {
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
                Safety Centre
              </h1>
              
              <div className="space-y-12 text-[16px] leading-relaxed text-ink-soft/90">
                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    Your safety matters
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">
                      WingleMingle is designed to make meeting people fun, exciting and genuine but your safety always comes first.
                    </p>
                    <p>
                      Every person you meet online is a stranger until you get to know them. Take your time, trust your instincts and never feel pressured to share information or do something you're uncomfortable with.
                    </p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    Keep your personal information private
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">
                      Never share sensitive personal information with someone you've just met.
                    </p>
                    <p className="mb-2">This can include:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Your home address</li>
                      <li>Personal phone numbers</li>
                      <li>Passwords or verification codes</li>
                      <li>Banking or payment information</li>
                      <li>Workplace or school details</li>
                      <li>Identification documents</li>
                      <li>Private photographs or videos</li>
                      <li>Information that could be used to access your accounts</li>
                    </ul>
                    <p>
                      Remember that your conversations can be copied or saved by another person. Only share something if you're comfortable with the possibility that it could be retained.
                    </p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    Take your time
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">
                      You don't have to meet someone in person just because you've connected online.
                    </p>
                    <p className="mb-4">
                      Get to know the person first. Chat, ask questions and look for consistency in what they tell you.
                    </p>
                    <p>
                      If something feels wrong, you can stop communicating at any time.
                    </p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    Meeting someone in person
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-2">
                      If you decide to meet someone you've met through WingleMingle:
                    </p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Meet in a public place.</li>
                      <li>Tell a friend or family member where you're going.</li>
                      <li>Consider arranging your own transportation.</li>
                      <li>Keep your phone charged.</li>
                      <li>Avoid accepting drinks or food that you have not seen prepared.</li>
                      <li>Don't share your home address for a first meeting.</li>
                      <li>Trust your instincts and leave if you feel uncomfortable.</li>
                    </ul>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    Never send money
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">
                      Be extremely careful if someone you meet on WingleMingle asks you for money.
                    </p>
                    <p className="mb-2">This includes requests involving:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Emergencies</li>
                      <li>Travel expenses</li>
                      <li>Medical bills</li>
                      <li>Investments</li>
                      <li>Business opportunities</li>
                      <li>Loans</li>
                      <li>Gift cards</li>
                      <li>Cryptocurrency</li>
                      <li>Account problems</li>
                    </ul>
                    <p className="mb-4">
                      A person asking for money online may be attempting to scam you.
                    </p>
                    <p>
                      WingleMingle will never ask you to send money to another user.
                    </p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    Watch out for fake identities and scams
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-2">Be cautious if someone:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Refuses to video chat or otherwise verify who they are</li>
                      <li>Has stories that constantly change</li>
                      <li>Quickly declares strong romantic feelings</li>
                      <li>Pressures you to move the conversation elsewhere</li>
                      <li>Asks for money</li>
                      <li>Asks for intimate photographs</li>
                      <li>Attempts to obtain passwords or verification codes</li>
                      <li>Sends suspicious links</li>
                      <li>Wants you to participate in financial transactions</li>
                    </ul>
                    <p>
                      If something doesn't feel right, stop communicating and report the account.
                    </p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    Blocking someone
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">
                      If another user makes you uncomfortable, you can block them.
                    </p>
                    <p className="mb-4">
                      Blocking can prevent the person from interacting with you through WingleMingle.
                    </p>
                    <p>
                      You do not need to explain to another user why you blocked them.
                    </p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    Reporting a user
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">
                      If you believe someone has violated our Community Guidelines, you can report them.
                    </p>
                    <p className="mb-2">You can report:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>A profile</li>
                      <li>A photograph</li>
                      <li>A message</li>
                      <li>A Wingle</li>
                      <li>A Secret Wingle</li>
                      <li>Harassment or inappropriate behaviour</li>
                      <li>Suspected scams or fraud</li>
                      <li>Fake or misleading identities</li>
                      <li>Other behaviour that makes you feel unsafe</li>
                    </ul>
                    <p>
                      Reports are treated seriously and may be reviewed by WingleMingle.
                    </p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    Secret Wingle safety
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">
                      Secret Wingle is designed for anonymous crush messages.
                    </p>
                    <p className="mb-4">
                      However, anonymity does not give anyone permission to harass, threaten, intimidate, sexually harass or repeatedly contact another person.
                    </p>
                    <p className="mb-2">Do not use Secret Wingle to:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Threaten someone</li>
                      <li>Send abusive messages</li>
                      <li>Send sexual or explicit content</li>
                      <li>Repeatedly contact someone who does not want contact</li>
                      <li>Reveal another person's private information</li>
                      <li>Impersonate another person</li>
                      <li>Intimidate or stalk someone</li>
                    </ul>
                    <p>
                      Misuse of Secret Wingle may result in restrictions, suspension or permanent removal from WingleMingle.
                    </p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    18+ only
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">
                      WingleMingle is intended for adults aged 18 and over.
                    </p>
                    <p className="mb-4">
                      You must not create an account if you are under 18.
                    </p>
                    <p>
                      If we discover or receive a credible report that an account belongs to someone under 18, we may suspend or remove the account and take appropriate steps to protect the individual.
                    </p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    If you feel threatened
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">
                      If you believe you are in immediate danger, contact your local emergency services or law enforcement authority.
                    </p>
                    <p>
                      WingleMingle is not an emergency service and cannot provide immediate physical protection.
                    </p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    Contact us
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">
                      If you need help with a safety issue, contact:
                    </p>
                    <p className="mb-4">
                      Email: <a href="mailto:info@winglemingle.com" className="text-berry-400 hover:text-berry-300 transition-colors">info@winglemingle.com</a>
                    </p>
                    <p className="mb-4">
                      You can also use our Report a Profile page.
                    </p>
                    <p className="font-medium text-berry-300">
                      Stay smart. Trust your instincts. Be kind.
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
