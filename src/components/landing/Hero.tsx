import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeartIcon, ShieldCheckIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { heroImage } from '../../data/seed';
import { seedUsers } from '../../data/seed';
import { seedPhotos } from '../../data/seed';

const facePhotos = seedPhotos.filter((p) => p.isPrimary && p.userId.startsWith('u-')).slice(0, 4);
const memberCount = seedUsers.filter((u) => u.role === 'member').length;

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-sand/60">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}>
          
          <h1 className="font-display text-[42px] leading-[1.02] tracking-[-0.02em] text-ink sm:text-[58px] lg:text-[68px]">
            Dating for people
            <br />
            who actually
            <em className="italic text-berry-500"> mean it</em>.
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-soft">
            No questionnaires. No compatibility scores. You write a real profile, look at real
            people, and send a request to the ones you want to meet. Every message you send is one
            you chose to spend.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/join">
              <Button size="lg" className="w-full sm:w-auto">
                <HeartIcon className="h-4 w-4" />
                Start dating
              </Button>
            </Link>
            <Link to="/join">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Create your profile
              </Button>
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-4">
            <div className="flex -space-x-3">
              {facePhotos.map((p) =>
              <img
                key={p.id}
                src={p.url}
                alt=""
                className="h-11 w-11 rounded-full border-2 border-cream object-cover" />

              )}
            </div>
            <p className="text-[13px] leading-snug text-ink-soft">
              <span className="font-medium text-ink">{memberCount * 1043} people</span> joined this
              month
              <br />
              in London and the South East.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.23, 1, 0.32, 1] }}
          className="relative">
          
          <img
            src={heroImage}
            alt="Two people laughing together at an outdoor café table"
            className="aspect-[4/5] w-full rounded-4xl object-cover shadow-lift" />
          
          <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-3xl bg-white px-4 py-3 shadow-card sm:left-8">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-moss/10 text-moss">
              <ShieldCheckIcon className="h-4 w-4" />
            </span>
            <span className="text-[13px] leading-tight">
              <span className="block font-medium text-ink">Every profile reviewed</span>
              <span className="block text-ink-muted">before it is shown to anyone</span>
            </span>
          </div>
        </motion.div>
      </div>
    </section>);

}