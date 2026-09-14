'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-ink selection:bg-berry-500/30 relative overflow-hidden font-sans">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-plum-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-berry-600/10 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-4xl px-5 py-12 md:py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-6 mb-12">
            <Link 
              href="/" 
              className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-ink-soft transition-all duration-300 hover:bg-white/10 hover:text-ink hover:border-white/20 self-start sm:self-auto"
            >
              <ArrowLeftIcon className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
              Back to Home
            </Link>
            <BrandMark size={56} className="opacity-90 transition-opacity hover:opacity-100" />
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#141414]/80 backdrop-blur-2xl p-8 md:p-14 shadow-2xl relative overflow-hidden">
            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none" />
            
            <div className="relative z-10">
              <h1 className="font-display text-4xl md:text-5xl font-bold bg-gradient-to-br from-berry-300 via-plum-300 to-indigo-300 bg-clip-text text-transparent mb-6 tracking-tight">
                Terms of Service
              </h1>
              <p className="text-sm font-semibold text-ink-muted uppercase tracking-[0.2em] mb-12 border-b border-white/10 pb-6">
                Last updated: {new Date().toLocaleDateString()}
              </p>
              
              <div className="space-y-12 text-[16px] leading-relaxed text-ink-soft/90">
                
                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">1</span>
                    Acceptance of Terms
                  </h2>
                  <div className="pl-13 ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p>By accessing and using Wingle Mingle, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use our service.</p>
                  </div>
                </section>
                
                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">2</span>
                    Eligibility
                  </h2>
                  <div className="pl-13 ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p>You must be at least 18 years old to use Wingle Mingle. By using the app, you represent and warrant that you have the right, authority, and capacity to enter into this agreement.</p>
                  </div>
                </section>
                
                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">3</span>
                    User Conduct
                  </h2>
                  <div className="pl-13 ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p>Users are expected to behave respectfully towards others. Any form of harassment, hate speech, or inappropriate behavior will result in immediate termination of the account. You are solely responsible for your interactions with other users.</p>
                  </div>
                </section>
                
                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">4</span>
                    Privacy
                  </h2>
                  <div className="pl-13 ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p>Your privacy is important to us. Please read our Privacy Policy to understand how we collect, use, and protect your personal information while providing you a safe environment to mingle.</p>
                  </div>
                </section>
                
                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">5</span>
                    Modifications
                  </h2>
                  <div className="pl-13 ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p>We reserve the right to modify these terms at any time. Your continued use of the service constitutes your acceptance of any such modifications.</p>
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
