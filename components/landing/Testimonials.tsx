import React from 'react';
import { testimonials, seedPhotos } from '@/lib/data/seed';

const facePhotos = seedPhotos.filter((p) => p.isPrimary && p.userId.startsWith('u-')).slice(0, 3);

export function Testimonials() {
  const [lead, ...rest] = testimonials;

  return (
    <section className="relative overflow-hidden border-b border-white/5 py-20 lg:py-32">
      {/* ── Background Image & Dark Overlays ── */}
      <div className="absolute inset-0">
        <img src="/testimonials-bg.jpg" alt="Friends having fun at the beach" className="absolute right-0 h-full w-full object-cover object-[70%_center] lg:w-[80%]" />
        {/* Gradient that is dark only on the left where text is, quickly fading to transparent */}
        <div className="absolute inset-0 bg-gradient-to-r from-black from-20% via-black/50 via-50% to-transparent" />
        {/* Very subtle fade at top and bottom edges only */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-20 lg:px-10">
        
        {/* ── Left Side: Header & Lead Card ── */}
        <div className="flex flex-col gap-10 lg:gap-14">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-1 w-8 rounded-full bg-gradient-to-r from-[#ec4899] to-[#0ea5e9]" />
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[#0ea5e9]">From our members</span>
            </div>
            <h2 className="font-display text-4xl font-bold leading-[1.1] text-white lg:text-[46px]">
              What people say once they have <br className="hidden lg:block"/>
              <span className="bg-gradient-to-r from-[#ec4899] to-[#a855f7] bg-clip-text text-transparent italic">actually met</span>{' '}
              <span className="bg-gradient-to-r from-[#0ea5e9] to-[#38bdf8] bg-clip-text text-transparent">someone</span>
            </h2>
          </div>

          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0d0b28]/60 p-8 shadow-2xl backdrop-blur-xl lg:p-12">
            {/* Corner Decorative Wave */}
            <div className="absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-gradient-to-tl from-[#0ea5e9] via-[#a855f7] to-[#ec4899] opacity-70 blur-2xl" />
            <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-tl from-[#0ea5e9] via-[#a855f7] to-[#ec4899]" />
            
            <div className="relative z-10">
              <span className="bg-gradient-to-r from-[#ec4899] to-[#0ea5e9] bg-clip-text font-display text-[80px] font-black leading-none text-transparent">“</span>
              <blockquote className="mt-2 font-display text-[22px] leading-[1.4] text-white lg:text-[26px]">
                {lead.quote}
              </blockquote>
              <div className="mt-10 flex items-center gap-4">
                <img src={facePhotos[0].url} alt="" className="h-14 w-14 rounded-full border-2 border-white/20 object-cover shadow-lg" />
                <div>
                  <p className="font-semibold text-white">{lead.name}</p>
                  <p className="text-[12px] text-white/50">{lead.detail}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Side: Stacked Cards ── */}
        <div className="flex flex-col gap-6 lg:mt-32">
          {rest.map((t, i) => (
            <div key={t.name} className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0b28]/60 p-7 shadow-xl backdrop-blur-xl lg:p-8">
              {/* Corner Decorative Wave */}
              <div className="absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-gradient-to-tl from-[#0ea5e9] via-[#a855f7] to-[#ec4899] opacity-70 blur-xl" />
              <div className="absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-gradient-to-tl from-[#0ea5e9] via-[#a855f7] to-[#ec4899]" />
              
              <div className="relative z-10">
                <span className="bg-gradient-to-r from-[#ec4899] to-[#0ea5e9] bg-clip-text font-display text-[60px] font-black leading-none text-transparent">“</span>
                <blockquote className="mt-1 text-[16px] leading-relaxed text-white/90">
                  {t.quote}
                </blockquote>
                <div className="mt-6 flex items-center gap-3">
                  <img src={facePhotos[i + 1].url} alt="" className="h-11 w-11 rounded-full border-2 border-white/20 object-cover shadow-md" />
                  <div>
                    <p className="font-semibold text-white text-[14px]">{t.name}</p>
                    <p className="text-[12px] text-white/50">{t.detail}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
