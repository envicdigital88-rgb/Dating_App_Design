'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';

export default function PrivacyPage() {
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
                Privacy Policy
              </h1>
              <p className="text-sm font-semibold text-ink-muted uppercase tracking-[0.2em] mb-12 border-b border-white/10 pb-6">
                Last updated: {new Date().toLocaleDateString()}
              </p>
              
              <div className="space-y-12 text-[16px] leading-relaxed text-ink-soft/90">
                
                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">1</span>
                    Information We Collect
                  </h2>
                  <div className="pl-13 ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p>We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, and other information you choose to provide.</p>
                  </div>
                </section>
                
                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">2</span>
                    How We Use Your Information
                  </h2>
                  <div className="pl-13 ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p>We use the information we collect about you to provide, maintain, and improve our services, including to facilitate connections with other users, provide customer support, and communicate with you about your account.</p>
                  </div>
                </section>
                
                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">3</span>
                    Sharing of Information
                  </h2>
                  <div className="pl-13 ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p>We may share the information we collect about you with other users as part of the normal operation of the service (e.g., your profile information). We will not share your personal information with third parties for their direct marketing purposes.</p>
                  </div>
                </section>
                
                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">4</span>
                    Data Security
                  </h2>
                  <div className="pl-13 ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>
                  </div>
                </section>
                
                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">5</span>
                    Contact Us
                  </h2>
                  <div className="pl-13 ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p>If you have any questions about this Privacy Policy, please contact us at privacy@winglemingle.com.</p>
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
