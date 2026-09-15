'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, AlertOctagonIcon } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';

export default function ReportPage() {
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
                Report a Profile
              </h1>
              
              <div className="grid sm:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <section className="group">
                    <h2 className="text-xl font-display font-semibold text-ink mb-4 flex items-center gap-3 transition-colors group-hover:text-berry-300">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-berry-500/10 text-berry-400">
                        <AlertOctagonIcon className="h-4 w-4" />
                      </span>
                      See something wrong?
                    </h2>
                    <div className="border-l-2 border-white/5 pl-6 py-1 ml-[1.25rem]">
                      <p className="text-ink-soft text-sm mb-2">We take all reports seriously.</p>
                      <p className="text-ink-soft text-sm">Please provide as much detail as possible so our moderation team can investigate.</p>
                    </div>
                  </section>
                </div>
                
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <h3 className="font-display font-semibold text-lg text-ink mb-4">Submit a report</h3>
                  <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div>
                      <label htmlFor="url" className="sr-only">Profile URL or Username</label>
                      <input type="text" id="url" placeholder="Profile URL or Username" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-berry-500/50 focus:outline-none focus:ring-1 focus:ring-berry-500/50" />
                    </div>
                    <div>
                      <label htmlFor="reason" className="sr-only">Reason</label>
                      <select id="reason" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-ink-muted focus:border-berry-500/50 focus:outline-none focus:ring-1 focus:ring-berry-500/50 appearance-none">
                        <option value="">Select a reason</option>
                        <option value="spam">Spam or Fake Profile</option>
                        <option value="harassment">Harassment or Abuse</option>
                        <option value="inappropriate">Inappropriate Content</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="details" className="sr-only">Details</label>
                      <textarea id="details" rows={4} placeholder="Additional details..." className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-berry-500/50 focus:outline-none focus:ring-1 focus:ring-berry-500/50 resize-none"></textarea>
                    </div>
                    <button type="submit" className="w-full rounded-xl bg-red-500/80 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-[#141414]">
                      Submit Report
                    </button>
                  </form>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
