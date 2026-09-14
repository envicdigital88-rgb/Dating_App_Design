'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon, MenuIcon, XIcon } from 'lucide-react';

const links = [
  { href: '#how', label: 'How it works' },
  { href: '#wingles', label: 'Wingles' },
  /* { href: '#packages', label: 'Packages' }, */
  { href: '#safety', label: 'Safety' },
  { href: '#faq', label: 'FAQ' },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-transparent">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-3 lg:px-10">
        {/* Logo */}
        <Link href="/" aria-label="Wingle Mingle home" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Wingle Mingle" width={38} height={38} className="rounded-xl object-contain" />
          <span className="hidden bg-gradient-to-r from-[#ec4899] to-[#0ea5e9] bg-clip-text font-display text-[17px] font-semibold text-transparent sm:block">
            Wingle Mingle
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Sections" className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[14px] text-white transition-colors duration-150 hover:text-white/80">
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/sign-in"
            className="text-[14px] font-medium text-white transition-colors hover:text-white/80">
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-[0_0_24px_rgba(236,72,153,0.4)]"
            style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b2fc9 60%, #0ea5e9 100%)' }}>
            Start wingling
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 md:hidden">
          {open ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-white/10 bg-[#07061a] px-5 pb-6 pt-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-[14px] text-white transition-colors hover:bg-white/5 hover:text-white/90">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex gap-2">
            <Link href="/sign-in" className="flex-1">
              <button className="w-full rounded-full border border-white/20 py-2.5 text-[14px] font-medium text-white transition hover:bg-white/10">
                Sign in
              </button>
            </Link>
            <Link href="/sign-up" className="flex-1">
              <button
                className="w-full rounded-full py-2.5 text-[14px] font-semibold text-white transition hover:opacity-90"
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