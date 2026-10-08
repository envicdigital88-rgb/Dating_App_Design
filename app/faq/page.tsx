'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';

const faqs = [
  {
    question: "What is WingleMingle?",
    answer: [
      "WingleMingle is a place to meet new people, discover interesting profiles, make connections and start conversations. Whether you're looking for a date, a new friend, a casual conversation or something more, you never know where a Wingle might lead."
    ]
  },
  {
    question: "Is WingleMingle free?",
    answer: [
      "Yes! Joining WingleMingle is completely free.",
      "When you create your account, you'll receive 20 free Wingits, and you'll receive 1 free Wingit every day you login just for coming back.",
      "You can purchase additional Wingits whenever you need them, starting from just LKR 100."
    ]
  },
  {
    question: "What are Wingits?",
    answer: [
      "Wingits are WingleMingle's virtual currency.",
      "You can use Wingits for different features and interactions within WingleMingle, such as viewing certain requests, unlocking additional photos and other services.",
      "You can earn some Wingits for free or purchase more when you run out."
    ]
  },
  {
    question: "How many Wingits do I get when I join?",
    answer: [
      "Every new member receives 20 free Wingits when they join WingleMingle.",
      "You'll also receive 1 free Wingit every day."
    ]
  },
  {
    question: "How much do Wingits cost?",
    answer: [
      "You can purchase 100 Wingits for LKR 100.",
      "We'll also introduce additional Wingit packages as WingleMingle grows, giving you more options depending on how you use the platform."
    ]
  },
  {
    question: "What is a Wingle?",
    answer: [
      "A Wingle is your way of showing someone that you'd like to connect.",
      "See someone interesting? Send them a Wingle and let them decide where it goes.",
      "A Wingle can be the beginning of a conversation, a friendship, a date or something completely unexpected."
    ]
  },
  {
    question: "Do I have to pay to receive a Wingle?",
    answer: [
      "You can receive Wingles for free.",
      "Certain actions, such as viewing or accepting a Wingle request, may require Wingits. This helps keep interactions meaningful while allowing everyone to join and start using WingleMingle for free."
    ]
  },
  {
    question: "What is a Secret Wingle?",
    answer: [
      "Secret Wingle is for the brave... and the curious.",
      "Have a crush on someone but don't want to reveal yourself straight away?",
      "Send them a Secret Wingle.",
      "They'll know that someone has a crush on them, but they won't know who sent it. If they choose to respond, you can start an anonymous conversation, exchange hints and decide later whether you want to reveal yourselves.",
      "Sometimes a little mystery is where the story begins."
    ]
  },
  {
    question: "Can I chat with someone anonymously?",
    answer: [
      "Secret Wingle allows you to start an anonymous conversation with someone who has received your Secret Wingle.",
      "You can choose to keep your identity hidden or reveal yourself when you're comfortable.",
      "And if you decide it's not for you, you can simply end the interaction."
    ]
  },
  {
    question: "Do I need to pay a subscription to use WingleMingle?",
    answer: [
      "No.",
      "WingleMingle does not require a subscription to join.",
      "You can use the platform for free, receive free Wingits and purchase additional Wingits whenever you want to access more features.",
      "Membership and subscription options may be introduced in the future."
    ]
  },
  {
    question: "Can I earn Wingits for free?",
    answer: [
      "Yes.",
      "You'll receive 20 Wingits when you join and 1 free Wingit every day.",
      "We may also introduce additional ways to earn Wingits through referrals, promotions and other activities as WingleMingle grows."
    ]
  },
  {
    question: "What happens when I run out of Wingits?",
    answer: [
      "Don't worry! You can continue using the parts of WingleMingle that don't require Wingits.",
      "When you need more, you can purchase additional Wingits starting from LKR 100."
    ]
  },
  {
    question: "Can I browse profiles without paying?",
    answer: [
      "Yes. WingleMingle is designed to let you discover and explore people without requiring a subscription.",
      "Some specific actions or premium interactions may require Wingits."
    ]
  },
  {
    question: "How do I make a connection?",
    answer: [
      "It's simple:",
      "Create your profile → Discover people → Send a Wingle → Connect → Start a conversation.",
      "And sometimes, a Secret Wingle might be the way you get there."
    ]
  },
  {
    question: "Is WingleMingle a dating app?",
    answer: [
      "WingleMingle is more than just dating.",
      "You can use it to meet people, make friends, start conversations, find dates and discover genuine connections.",
      "What your Wingle becomes is up to you."
    ]
  },
  {
    question: "Is WingleMingle available as an app?",
    answer: [
      "WingleMingle currently works as a Progressive Web App (PWA).",
      "You can use it directly from your browser and install it on your phone's home screen for an app-like experience without needing to download it from an app store.",
      "A dedicated iOS and Android app may come in the future."
    ]
  },
  {
    question: "Is my information safe?",
    answer: [
      "We take privacy and safety seriously.",
      "WingleMingle includes tools such as blocking, reporting and profile/photo moderation to help keep the community safer.",
      "Never share passwords, financial information or other sensitive personal information with another member."
    ]
  },
  {
    question: "What should I do if someone makes me uncomfortable?",
    answer: [
      "You can block or report another member if their behaviour makes you uncomfortable or violates our community guidelines.",
      "If you believe someone is behaving dangerously or illegally, report them to WingleMingle and contact the appropriate authorities when necessary."
    ]
  },
  {
    question: "Can I delete my WingleMingle account?",
    answer: [
      "Yes. You can request deletion of your account and associated information through the account settings/support process."
    ]
  },
  {
    question: "Is WingleMingle only for people looking for relationships?",
    answer: [
      "Not at all.",
      "You might join looking for a date, a friend, someone interesting to talk to, or simply to see who you meet.",
      "There's no telling where a Wingle might lead."
    ]
  }
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#07061a] text-ink selection:bg-berry-500/30 relative overflow-hidden font-sans">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#8b2fc9] opacity-35 blur-[100px]" />
        <div className="absolute -bottom-32 right-0 h-[350px] w-[350px] rounded-full bg-[#0ea5e9] opacity-25 blur-[90px]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ec4899] opacity-10 blur-[80px]" />
      </div>

      <div className="pointer-events-none absolute -right-16 top-1/2 -translate-y-1/2 select-none opacity-[0.06]">
        <img src="/logo.png" alt="" width={380} height={380} className="object-contain" />
      </div>

      <div className="mx-auto max-w-4xl px-5 py-12 md:py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-col-reverse items-center sm:flex-row sm:items-center justify-between gap-6 mb-12">
            <Link 
              href="/" 
              className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-ink-soft transition-all duration-300 hover:bg-white/10 hover:text-ink hover:border-white/20 sm:self-auto"
            >
              <ArrowLeftIcon className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
              Back to Home
            </Link>
            <BrandMark size={56} className="opacity-90 transition-opacity hover:opacity-100" />
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-3xl p-8 md:p-14 shadow-2xl relative overflow-hidden">
            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none" />
            
            <div className="relative z-10">
              <h1 className="font-display text-4xl md:text-5xl font-bold bg-gradient-to-br from-berry-300 via-plum-300 to-indigo-300 bg-clip-text text-transparent mb-6 tracking-tight text-center sm:text-left">
                Frequently Asked Questions
              </h1>
              <p className="text-sm font-semibold text-ink-muted uppercase tracking-[0.2em] mb-12 border-b border-white/10 pb-6 text-center sm:text-left">
                Everything you need to know
              </p>
              
              <div className="space-y-12 text-[16px] leading-relaxed text-ink-soft/90">
                {faqs.map((faq, index) => (
                  <section key={index} className="group">
                    <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-start sm:items-center gap-4 transition-colors group-hover:text-berry-300">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner mt-0.5 sm:mt-0">
                        {index + 1}
                      </span>
                      <span>{faq.question}</span>
                    </h2>
                    <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1 space-y-4">
                      {faq.answer.map((paragraph, pIndex) => (
                        <p key={pIndex}>{paragraph}</p>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
