'use client';

import React from 'react';
import Link from 'next/link';

import { motion } from 'framer-motion';
import { ArrowRightIcon, ShieldCheckIcon, UserIcon } from 'lucide-react';
import { seedPhotos, seedUsers } from '@/lib/data/seed';

const facePhotos = seedPhotos.filter((p) => p.isPrimary && p.userId.startsWith('u-')).slice(0, 4);
const memberCount = seedUsers.filter((u) => u.role === 'member').length;

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-black" style={{ minHeight: '90vh' }}>

      {/* ── Background orbs — pushed down to keep the top extremely dark ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Magenta/purple left — pushed down and reduced */}
        <div className="absolute -left-40 top-40 h-[650px] w-[650px] rounded-full opacity-20 blur-[150px]"
          style={{ background: 'radial-gradient(circle, #a21caf 0%, #7c3aed 60%, transparent 100%)' }} />
        {/* Electric blue right — pushed down */}
        <div className="absolute -right-20 top-48 h-[600px] w-[600px] rounded-full opacity-20 blur-[140px]"
          style={{ background: 'radial-gradient(circle, #0ea5e9 0%, #1d4ed8 60%, transparent 100%)' }} />
        {/* Subtle bottom dark blue */}
        <div className="absolute bottom-0 left-1/2 h-[300px] w-[500px] -translate-x-1/2 rounded-full opacity-15 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #1e3a8a 0%, transparent 100%)' }} />
      </div>



      {/* ── Main grid ── */}
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-10 lg:py-20">

        {/* ── LEFT: Text ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}>



          {/* Headline */}
          <h1 className="font-display text-[52px] font-bold leading-[1.05] tracking-[-0.02em] text-white sm:text-[60px] lg:text-[68px]">
            Where strangers
            <br />
            become
            <br />
            <em
              className="not-italic"
              style={{
                background: 'linear-gradient(90deg, #ec4899 0%, #c026d3 40%, #0ea5e9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
              storylines.
            </em>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/50">
            More than just a dating app. Wingle Mingle is the perfect place to
            make new friends, enjoy great chats, and build genuine relationships.
            No questionnaires or compatibility scores—just real people choosing to connect.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/sign-up">
              <button
                className="flex items-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-semibold text-white shadow-xl transition-all duration-200 hover:scale-105 hover:shadow-[0_0_40px_rgba(236,72,153,0.45)]"
                style={{ background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #0ea5e9 100%)' }}>
                Start wingling
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </Link>
            <Link href="/sign-up">
              <button className="flex items-center gap-2.5 rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-[15px] font-semibold text-white/75 backdrop-blur-sm transition-all duration-200 hover:bg-white/10 hover:text-white">
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
                  className="h-10 w-10 rounded-full border-2 border-[#060414] object-cover"
                />
              ))}
            </div>
            <div>
              <p className="text-[13px] text-white/50">
                <span className="font-semibold text-white">{memberCount * 1043} people</span> joined this month
              </p>
              <p className="text-[12px] text-white/30">in London and the South East.</p>
            </div>
          </div>
        </motion.div>

        {/* ── RIGHT: Hero image with neon glow frame + 3D tilt ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          className="relative flex items-center justify-center pt-10 lg:pt-0">

          {/* ── Outer glowing neon blob ── */}
          <motion.div
            animate={{
              borderRadius: [
                '41% 59% 70% 30% / 32% 40% 60% 68%',
                '60% 40% 30% 70% / 60% 30% 70% 40%',
                '30% 70% 70% 30% / 30% 70% 30% 70%',
                '41% 59% 70% 30% / 32% 40% 60% 68%',
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-[6px] opacity-80"
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 40%, #0ea5e9 100%)',
              filter: 'blur(8px)',
            }}
          />
          <motion.div
            animate={{
              borderRadius: [
                '41% 59% 70% 30% / 32% 40% 60% 68%',
                '60% 40% 30% 70% / 60% 30% 70% 40%',
                '30% 70% 70% 30% / 30% 70% 30% 70%',
                '41% 59% 70% 30% / 32% 40% 60% 68%',
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-[2px]"
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 40%, #0ea5e9 100%)',
            }}
          />

          {/* ── Image inside the blob ── */}
          <motion.div
            animate={{
              borderRadius: [
                '41% 59% 70% 30% / 32% 40% 60% 68%',
                '60% 40% 30% 70% / 60% 30% 70% 40%',
                '30% 70% 70% 30% / 30% 70% 30% 70%',
                '41% 59% 70% 30% / 32% 40% 60% 68%',
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="relative z-10 h-[380px] w-full max-w-[440px] overflow-hidden lg:h-[480px]">
            <img
              src="/hero.jpg"
              alt="Group of happy friends on a beach"
              className="block h-full w-full object-cover"
            />
            {/* Dark overlay for contrast at bottom */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#020108]/70 to-transparent" />
          </motion.div>

          {/* ── Floating Badge: New Like (Top Left) ── */}
          <motion.div
            initial={{ opacity: 0, y: 20, x: -20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 100 }}
            className="absolute -left-4 top-4 z-20 flex w-[220px] items-center gap-3 rounded-2xl border border-white/10 bg-[#28264d]/60 px-4 py-3 shadow-2xl backdrop-blur-md lg:-left-12 lg:top-10">
            <img src={facePhotos[0]?.url} alt="" className="h-9 w-9 rounded-full border border-white/20 object-cover" />
            <div className="flex-1">
              <p className="text-[12px] font-semibold text-white">New like</p>
              <p className="text-[10px] leading-tight text-white/50">Someone special liked your profile!</p>
            </div>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ec4899]">
              <span className="text-[12px] text-white">♡</span>
            </div>
          </motion.div>

          {/* ── Floating Badge: Make new friends (Bottom Right) ── */}
          <motion.div
            initial={{ opacity: 0, y: 20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 100 }}
            className="absolute -right-4 bottom-24 z-20 flex w-[230px] items-center gap-3 rounded-2xl border border-white/10 bg-[#28264d]/60 px-4 py-3 shadow-2xl backdrop-blur-md lg:-right-12 lg:bottom-32">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#9333ea]">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[12px] font-semibold text-white">Make new friends</p>
              <p className="text-[10px] leading-tight text-white/50">Great conversations start here</p>
            </div>
            <ArrowRightIcon className="h-3.5 w-3.5 text-white/30" />
          </motion.div>

          {/* ── Floating Badge: Find your person (Bottom Left) ── */}
          <motion.div
            initial={{ opacity: 0, y: 20, x: -20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            transition={{ delay: 1.0, type: 'spring', stiffness: 100 }}
            className="absolute -bottom-6 left-2 z-20 flex w-[220px] items-center gap-3 rounded-2xl border border-white/10 bg-[#28264d]/60 px-4 py-3 shadow-2xl backdrop-blur-md lg:-bottom-2 lg:left-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ec4899]">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[12px] font-semibold text-white">Find your person</p>
              <p className="text-[10px] leading-tight text-white/50">Love, friendship, anything is possible</p>
            </div>
            <ArrowRightIcon className="h-3.5 w-3.5 text-white/30" />
          </motion.div>

          {/* ── Top Right Text + Profile Bubbles ── */}
          <div className="absolute right-0 top-0 hidden flex-col items-center gap-3 lg:flex lg:translate-x-12">
            <div className="flex flex-col items-center">
              <p className="font-display text-[13px] italic leading-tight text-white/40">Real people</p>
              <p className="font-display text-[13px] italic leading-tight text-white/40">Real vibes</p>
              <div className="mt-2 h-6 w-px bg-gradient-to-b from-white/20 to-transparent" />
            </div>
            <div className="flex flex-col gap-2">
              {facePhotos.slice(1, 4).map((p, i) => (
                <motion.img
                  key={p.id}
                  src={p.url}
                  alt=""
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="h-9 w-9 rounded-full border border-white/20 object-cover shadow-lg"
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
