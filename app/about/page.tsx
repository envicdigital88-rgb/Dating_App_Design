'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';

export default function AboutPage() {
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
              <h1 className="font-display text-4xl md:text-5xl font-bold bg-gradient-to-br from-berry-300 via-plum-300 to-indigo-300 bg-clip-text text-transparent mb-12 tracking-tight text-center sm:text-left">
                About Wingle Mingle
              </h1>
              
              <div className="space-y-12 text-[16px] leading-relaxed text-ink-soft/90">
                
                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    Our Story
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">
                      Wingle Mingle started with a simple observation: modern dating apps feel like job interviews. People spend more time swiping and judging than actually talking and connecting. We wanted to change that.
                    </p>
                    <p>
                      We built a platform where genuine interaction takes the center stage. No endless questionnaires, no algorithmic compatibility scores—just real people finding each other based on shared interests, humor, and a genuine desire to connect.
                    </p>
                  </div>
                </section>
                
                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    Our Mission
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p>
                      Our mission is to foster meaningful connections in a safe, fun, and inclusive environment. Whether you are looking for romance, companionship, or just a great conversation on a Friday night, we are here to help you turn strangers into your favorite storylines.
                    </p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                    The Team
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p>
                      We are a small, passionate team of designers, developers, and hopeless romantics based out of London. We believe that technology should bring us closer together, not further apart. We are constantly listening to our community and improving Wingle Mingle every day.
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
