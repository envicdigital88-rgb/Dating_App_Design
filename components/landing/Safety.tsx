import React from 'react';
import { BanIcon, EyeOffIcon, FlagIcon, LockKeyholeIcon, ScanFaceIcon, Trash2Icon } from 'lucide-react';
import { SectionHeading } from '../ui/Bits';
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
    <section id="safety" className="border-b border-sand/60 py-16 text-ink lg:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <SectionHeading
              align="responsive"
              overline="Safety & privacy"
              title="Built so you can be honest without being exposed"
              body="Wingling asks a lot of you. The least an app can do is keep your details, your photos and your conversations under your control."
            />
            <img
              src={lifestyleImage}
              alt=""
              className="mt-8 aspect-[16/9] w-full rounded-4xl object-cover opacity-90 mix-blend-luminosity [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)]" />
            
          </div>

          <ul className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {items.map((item) =>
            <li key={item.title} className="flex flex-col items-center text-center sm:items-start sm:text-left">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-berry-500/10 text-berry-500">
                  {item.icon}
                </span>
                <h3 className="font-display text-lg text-ink">{item.title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-muted">{item.body}</p>
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>);

}