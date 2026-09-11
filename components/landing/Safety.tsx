import React from 'react';
import { BanIcon, EyeOffIcon, FlagIcon, LockKeyholeIcon, ScanFaceIcon, Trash2Icon } from 'lucide-react';
import {  } from '../ui/Bits';
import { lifestyleImage } from '@/lib/data/seed';

const items = [
{
  icon: <ScanFaceIcon className="h-5 w-5" />,
  title: 'Reviewed profiles',
  body: 'Every profile and photo is checked by our moderation team before it appears in Discover.'
},
{
  icon: <EyeOffIcon className="h-5 w-5" />,
  title: 'Minimal exposure',
  body: 'Only your first name, age and area are ever public. Contact details are never shown.'
},
{
  icon: <BanIcon className="h-5 w-5" />,
  title: 'Block instantly',
  body: 'Blocking removes someone from your Discover, your wingles and your inbox at once.'
},
{
  icon: <FlagIcon className="h-5 w-5" />,
  title: 'Report anything',
  body: 'Report a profile, a photo or a mingle. Reports are anonymous and always reviewed.'
},
{
  icon: <LockKeyholeIcon className="h-5 w-5" />,
  title: 'Protected payments',
  body: 'Payments are verified on our servers. Nothing unlocks until your bank confirms it.'
},
{
  icon: <Trash2Icon className="h-5 w-5" />,
  title: 'Leave cleanly',
  body: 'Delete your account whenever you want and your photos and mingles go with it.'
}];


export function Safety() {
  return (
    <section id="safety" className="border-b border-sand/60 bg-plum-500 py-16 text-cream lg:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="mb-3 text-[13px] font-semibold text-berry-200">Safety &amp; privacy</p>
            <h2 className="font-display text-3xl leading-[1.1] text-cream sm:text-4xl">
              Built so you can be honest without being exposed
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-cream/75">
              Wingling asks a lot of you. The least an app can do is keep your details, your photos and
              your conversations under your control.
            </p>
            <img
              src={lifestyleImage}
              alt=""
              className="mt-8 hidden aspect-[16/9] w-full rounded-4xl object-cover lg:block" />
            
          </div>

          <ul className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {items.map((item) =>
            <li key={item.title}>
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-cream/10 text-cream">
                  {item.icon}
                </span>
                <h3 className="font-display text-lg text-cream">{item.title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-cream/70">{item.body}</p>
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>);

}