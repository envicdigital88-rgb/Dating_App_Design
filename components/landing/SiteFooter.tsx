import React from 'react';
import Link from 'next/link';

import { BrandMark } from '../BrandMark';

const columns = [
{
  title: 'Wingle Mingle',
  links: [
  { label: 'How it works', href: '#how' },
  { label: 'Wingling wingles', href: '#wingles' },
  { label: 'Install the app', href: '#install' }]

},
{
  title: 'Safety',
  links: [
  { label: 'Safety centre', href: '/safety' },
  { label: 'Community guidelines', href: '/guidelines' },
  { label: 'Report a profile', href: '/report' },
  { label: 'Privacy settings', href: '/privacy-settings' }]

},
{
  title: 'Company',
  links: [
  { label: 'About us', href: '/about' },
  { label: 'Contact', href: '/contact' }]

}];


export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-gradient-to-r from-plum-500/10 to-berry-500/10 py-14 text-ink/80 backdrop-blur-3xl">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr]">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <BrandMark />
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed">
              More than just a dating app. The perfect place to make new friends, enjoy great chats, and build genuine connections with real people.
            </p>
            <div className="mt-6 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row lg:justify-start">
              <Link href="/sign-up"
                className="rounded-full bg-cream px-5 py-2.5 text-[13px] font-medium text-plum-600 transition-colors duration-150 ease-soft hover:bg-cream-deep">
                
                Create your profile
              </Link>
              <Link href="/sign-in"
                className="rounded-full border border-ink/25 px-5 py-2.5 text-[13px] font-medium text-ink transition-colors duration-150 ease-soft hover:bg-ink/10">
                
                Sign in
              </Link>
            </div>
          </div>

          <div className="grid gap-8 text-center sm:grid-cols-3 sm:text-left">
            {columns.map((col) =>
            <div key={col.title}>
                <h3 className="mb-5 text-[13px] font-bold uppercase tracking-[0.1em] text-berry-500">
                  {col.title}
                </h3>
                <ul className="space-y-3">
                  {col.links.map((link) =>
                <li key={link.label}>
                      <a
                    href={link.href}
                    className="text-[14px] text-ink-soft transition-colors duration-150 ease-soft hover:text-white">
                    
                        {link.label}
                      </a>
                    </li>
                )}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-ink/12 pt-6 text-center text-[13px] sm:flex-row sm:text-left">
          <p>&copy; {new Date().getFullYear()} Wingle Mingle. All rights reserved.</p>
          <p className="flex justify-center gap-5">
            <Link href="/terms" className="hover:text-ink">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-ink">
              Privacy
            </Link>
            <Link href="/cookies" className="hover:text-ink">
              Cookies
            </Link>
          </p>
        </div>
      </div>
    </footer>);

}
