'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon, MenuIcon, XIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const links = [
  { href: '/', label: 'Home' },
  { href: '#how', label: 'How it works' },
  { href: '#wingles', label: 'Wingles' },
  { href: '#safety', label: 'Safety' },
  { href: '#faq', label: 'FAQ' },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [activeHash, setActiveHash] = useState('/');

  useEffect(() => {
    const handleScroll = () => {
      // If we are in the top half of the screen (Hero section), Home is active
      if (window.scrollY < window.innerHeight / 2) {
        setActiveHash('/');
        return;
      }

      const sections = links
        .filter(l => l.href.startsWith('#'))
        .map(l => {
          const el = document.getElementById(l.href.substring(1));
          return { href: l.href, top: el ? el.getBoundingClientRect().top : Infinity };
        });

      let current = '/';
      const trigger = window.innerHeight / 3;

      for (const s of sections) {
        if (s.top <= trigger) {
          current = s.href;
        }
      }

      setActiveHash(current);
    };

    const handleHashChange = () => {
      const hash = window.location.hash || '/';
      setActiveHash(hash);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('hashchange', handleHashChange);
    
    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return (
    <header className="fixed top-6 left-0 right-0 z-50 pointer-events-none px-5 lg:px-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 pointer-events-auto">
        {/* Logo */}
        <Link href="/" aria-label="Wingle Mingle home" className="flex items-center gap-2.5 bg-[#0a0a0a]/80 backdrop-blur-md rounded-full px-4 py-2 border border-white/10 shadow-lg">
          <Image src="/logo.png" alt="Wingle Mingle" width={32} height={32} className="rounded-xl object-contain" />
          <span className="hidden bg-gradient-to-r from-[#ec4899] to-[#0ea5e9] bg-clip-text font-display text-[16px] font-semibold text-transparent xl:block">
            Wingle Mingle
          </span>
        </Link>

        {/* Desktop nav - The Pill */}
        <nav aria-label="Sections" className="hidden items-center gap-1 md:flex bg-[#111111]/95 backdrop-blur-xl rounded-full p-1.5 border border-white/10 shadow-2xl">
          {links.map((l) => {
            const isActive = activeHash === l.href;
            return (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => {
                  if (l.href.startsWith('#')) {
                    e.preventDefault();
                    const el = document.getElementById(l.href.substring(1));
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                    }
                  } else if (l.href === '/') {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                  setActiveHash(l.href);
                }}
                className={`relative px-5 py-2.5 text-[14px] font-medium rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'text-white shadow-[0_0_20px] shadow-berry-500/40' 
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 rounded-full bg-berry-500"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{l.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex bg-[#0a0a0a]/80 backdrop-blur-md rounded-full p-1.5 border border-white/10 shadow-lg">
          <Link
            href="/sign-in"
            className="px-4 text-[14px] font-medium text-white transition-colors hover:text-white/80">
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-[0_0_24px] hover:shadow-[#ec4899]/40"
            style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b2fc9 60%, #0ea5e9 100%)' }}>
            Start wingling
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile hamburger */}
        <div className="flex md:hidden bg-[#0a0a0a]/80 backdrop-blur-md rounded-full p-1 border border-white/10 shadow-lg">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="rounded-full p-2.5 text-white transition-colors hover:bg-white/10">
            {open ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="pointer-events-auto absolute left-5 right-5 top-20 rounded-2xl border border-white/10 bg-[#111111]/95 backdrop-blur-2xl p-5 shadow-2xl md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => {
                  if (l.href.startsWith('#')) {
                    e.preventDefault();
                    const el = document.getElementById(l.href.substring(1));
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                    }
                  } else if (l.href === '/') {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                  setActiveHash(l.href);
                  setOpen(false);
                }}
                className={`rounded-xl px-4 py-3 text-[15px] font-medium transition-colors ${
                  activeHash === l.href 
                    ? 'bg-berry-500 text-white shadow-[0_0_15px] shadow-berry-500/40' 
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}>
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-6 flex flex-col gap-3 pt-6 border-t border-white/10">
            <Link href="/sign-in" className="w-full">
              <button className="w-full rounded-full border border-white/20 py-3 text-[15px] font-medium text-white transition hover:bg-white/10">
                Sign in
              </button>
            </Link>
            <Link href="/sign-up" className="w-full">
              <button
                className="w-full rounded-full py-3 text-[15px] font-semibold text-white transition hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #ec4899, #8b2fc9, #0ea5e9)' }}>
                Start wingling
              </button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}