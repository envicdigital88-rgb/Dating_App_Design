'use client';

import React, { useState } from 'react';
import Link from 'next/link';

import { MenuIcon, XIcon } from 'lucide-react';
import { BrandMark } from '../BrandMark';
import { Button } from '../ui/Button';

const links = [
{ href: '#how', label: 'How it works' },
{ href: '#requests', label: 'Requests' },
{ href: '#packages', label: 'Packages' },
{ href: '#safety', label: 'Safety' },
{ href: '#faq', label: 'FAQ' }];


export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-sand/60 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-3.5 lg:px-8">
        <Link href="/" aria-label="Kindred home">
          <BrandMark />
        </Link>

        <nav aria-label="Sections" className="hidden items-center gap-7 md:flex">
          {links.map((l) =>
          <a
            key={l.href}
            href={l.href}
            className="text-sm text-ink-soft transition-colors duration-150 ease-soft hover:text-berry-600">
            
              {l.label}
            </a>
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/signin">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/join">
            <Button size="sm">Start dating</Button>
          </Link>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="rounded-full p-2 text-ink transition-colors duration-150 ease-soft hover:bg-cream-deep md:hidden">
          
          {open ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      {open &&
      <div className="border-t border-sand/60 bg-cream px-5 pb-5 pt-3 md:hidden">
          <nav aria-label="Sections" className="flex flex-col">
            {links.map((l) =>
          <a
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            className="border-b border-sand/60 py-3 text-sm text-ink-soft">
            
                {l.label}
              </a>
          )}
          </nav>
          <div className="mt-4 flex gap-2">
            <Link href="/signin" className="flex-1">
              <Button variant="outline" block size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/join" className="flex-1">
              <Button block size="sm">
                Start dating
              </Button>
            </Link>
          </div>
        </div>
      }
    </header>);

}