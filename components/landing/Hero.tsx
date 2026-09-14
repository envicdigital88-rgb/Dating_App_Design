'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { motion } from 'framer-motion';
import { ArrowRightIcon, HeartIcon, ShieldCheckIcon, UserIcon } from 'lucide-react';
import { heroImage, seedPhotos, seedUsers } from '@/lib/data/seed';

const facePhotos = seedPhotos.filter((p) => p.isPrimary && p.userId.startsWith('u-')).slice(0, 4);
const memberCount = seedUsers.filter((u) => u.role === 'member').length;

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#07061a]">

      {/* ── Background glowing orbs ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#8b2fc9] opacity-30 blur-[130px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-[#0ea5e9] opacity-20 blur-[110px]" />
        <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-[#4f1d7a] opacity-25 blur-[120px]" />
      </div>

      {/* ── "Swipe Explore Connect" side label ── */}
      <div className="pointer-events-none absolute bottom-12 left-4 hidden flex-col items-center gap-1 lg:flex">
        <div className="flex flex-col items-start gap-0.5">
          {['Swipe', 'Explore', 'Connect'].map((word) => (
            <span key={word} className="font-display text-[13px] italic text-white/30">{word}</span>
          ))}
        </div>
        <div className="mt-1 h-10 w-px bg-gradient-to-b from-white/20 to-transparent" />
      </div>

      {/* ── Main grid ── */}
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-[1fr_1fr] lg:gap-12 lg:px-10 lg:py-24">

        {/* ── LEFT: Text content ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}>

          {/* Pills */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-medium text-white/60 backdrop-blur-sm">
            <HeartIcon className="h-3 w-3 text-[#ec4899]" />
            Real People
            <span className="text-white/30">•</span>
            Genuine Connections
            <span className="text-white/30">•</span>
            Your Story
          </div>

          {/* Headline */}
          <h1 className="font-display text-[46px] font-bold leading-[1.05] tracking-[-0.02em] text-white sm:text-[58px] lg:text-[64px]">
            Where strangers
            <br />
            become
            <br />
            <em
              className="not-italic"
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #0ea5e9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
              storylines.
            </em>
            <span className="ml-2 text-[#ec4899]">♡</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/55">
            More than just a dating app. Wingle Mingle is the perfect place to make new friends, enjoy great chats, and build genuine relationships. No questionnaires or compatibility scores—just real people choosing to connect.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/sign-up">
              <button
                className="flex items-center gap-2.5 rounded-full px-6 py-3.5 text-[15px] font-semibold text-white shadow-xl transition-all duration-200 hover:scale-105 hover:shadow-[0_0_36px_rgba(236,72,153,0.45)]"
                style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b2fc9 55%, #0ea5e9 100%)' }}>
                <HeartIcon className="h-4 w-4" />
                Start wingling
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </Link>
            <Link href="/sign-up">
              <button className="flex items-center gap-2.5 rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-[15px] font-semibold text-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/10 hover:text-white">
                <UserIcon className="h-4 w-4" />
                Create your profile
              </button>
            </Link>
          </div>

          {/* Members count */}
          <div className="mt-8 flex items-center gap-3">
            <div className="flex -space-x-2.5">
              {facePhotos.map((p) => (
                <img
                  key={p.id}
                  src={p.url}
                  alt=""
                  className="h-10 w-10 rounded-full border-2 border-[#07061a] object-cover"
                />
              ))}
            </div>
            <div>
              <p className="text-[13px] leading-snug text-white/50">
                <span className="font-semibold text-white">{memberCount * 1043} people</span> joined this month
              </p>
              <p className="text-[12px] text-white/35">in London and the South East.</p>
            </div>
          </div>
        </motion.div>

        {/* ── RIGHT: Hero image with effects ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          className="relative flex items-center justify-center">

          {/* Glowing ring behind image */}
          <div
            className="absolute inset-0 rounded-3xl opacity-60 blur-[2px]"
            style={{
              background: 'linear-gradient(135deg, #ec4899, #8b2fc9, #0ea5e9)',
              padding: '2px',
            }}
          />

          {/* Image container */}
          <div className="relative z-10 overflow-hidden rounded-3xl border-2 border-white/10 shadow-2xl"
            style={{ boxShadow: '0 0 60px rgba(139,47,201,0.4), 0 0 30px rgba(14,165,233,0.2)' }}>
            <img
              src={heroImage}
              alt="Two people laughing together at an outdoor café table"
              className="aspect-[4/4] w-full object-cover lg:aspect-auto lg:h-[480px]"
            />
            {/* Subtle overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07061a]/40 via-transparent to-transparent" />
          </div>

          {/* "Every profile reviewed" badge */}
          <div className="absolute -bottom-4 left-6 z-20 flex items-center gap-2.5 rounded-2xl border border-white/10 bg-[#0d0b24]/90 px-4 py-3 shadow-xl backdrop-blur-xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0ea5e9]/20 text-[#0ea5e9]">
              <ShieldCheckIcon className="h-4 w-4" />
            </span>
            <div>
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-white">
                Every profile reviewed
                <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
              </p>
              <p className="text-[11px] text-white/45">before it is shown to anyone</p>
            </div>
          </div>

          {/* "Real people Real vibes" side label */}
          <div className="absolute -right-4 top-10 hidden flex-col items-center lg:flex">
            <p className="font-display text-[13px] italic leading-tight text-white/40">Real people</p>
            <p className="font-display text-[13px] italic leading-tight text-white/40">Real vibes ♡</p>
            <div className="mt-2 h-8 w-px bg-gradient-to-b from-[#ec4899]/40 to-transparent" />
          </div>

          {/* Profile bubbles on the right */}
          <div className="absolute -right-5 top-1/2 hidden -translate-y-1/2 flex-col gap-2 lg:flex">
            {facePhotos.slice(0, 3).map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}>
                <img
                  src={p.url}
                  alt=""
                  className="h-10 w-10 rounded-full border-2 object-cover shadow-lg"
                  style={{ borderColor: i === 0 ? '#ec4899' : i === 1 ? '#8b2fc9' : '#0ea5e9' }}
                />
              </motion.div>
            ))}
          </div>

          {/* Dots */}
          <div className="absolute -bottom-8 right-6 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === 0 ? 'w-5 bg-[#ec4899]' : 'w-1.5 bg-white/20'}`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
