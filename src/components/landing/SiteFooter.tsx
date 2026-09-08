import React from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../BrandMark';

const columns = [
{
  title: 'Kindred',
  links: [
  { label: 'How it works', href: '#how' },
  { label: 'Dating requests', href: '#requests' },
  { label: 'Packages', href: '#packages' },
  { label: 'Install the app', href: '#install' }]

},
{
  title: 'Safety',
  links: [
  { label: 'Safety centre', href: '#safety' },
  { label: 'Community guidelines', href: '#safety' },
  { label: 'Report a profile', href: '#safety' },
  { label: 'Privacy settings', href: '#safety' }]

},
{
  title: 'Company',
  links: [
  { label: 'About us', href: '#' },
  { label: 'Careers', href: '#' },
  { label: 'Press', href: '#' },
  { label: 'Contact', href: '#' }]

}];


export function SiteFooter() {
  return (
    <footer className="bg-plum-600 py-14 text-cream/70">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <BrandMark tone="cream" />
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed">
              Dating for people who actually mean it. Profiles, photos, requests and real
              conversations — no questionnaires, no compatibility scores.
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                to="/join"
                className="rounded-full bg-cream px-5 py-2.5 text-[13px] font-medium text-plum-600 transition-colors duration-150 ease-soft hover:bg-white">
                
                Create your profile
              </Link>
              <Link
                to="/signin"
                className="rounded-full border border-cream/25 px-5 py-2.5 text-[13px] font-medium text-cream transition-colors duration-150 ease-soft hover:bg-cream/10">
                
                Sign in
              </Link>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {columns.map((col) =>
            <div key={col.title}>
                <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-cream">
                  {col.title}
                </h3>
                <ul className="space-y-2.5">
                  {col.links.map((link) =>
                <li key={link.label}>
                      <a
                    href={link.href}
                    className="text-[14px] transition-colors duration-150 ease-soft hover:text-cream">
                    
                        {link.label}
                      </a>
                    </li>
                )}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-cream/12 pt-6 text-[13px] sm:flex-row">
          <p>© {new Date().getFullYear()} Kindred Dating Ltd. All rights reserved.</p>
          <p className="flex gap-5">
            <a href="#" className="hover:text-cream">
              Terms
            </a>
            <a href="#" className="hover:text-cream">
              Privacy
            </a>
            <a href="#" className="hover:text-cream">
              Cookies
            </a>
          </p>
        </div>
      </div>
    </footer>);

}