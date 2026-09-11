'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from 'lucide-react';
import type { Photo } from '@/lib/types';

export function PhotoGallery({ photos, name }: {photos: Photo[];name: string;}) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-4xl bg-cream-deep text-sm text-ink-muted">
        No photos yet
      </div>);

  }

  return (
    <>
      <div className="space-y-3">
        <button
          onClick={() => setLightbox(true)}
          className="group relative block w-full overflow-hidden rounded-4xl bg-cream-deep">
          
          <img
            src={photos[active].url}
            alt={`${name}, photo ${active + 1}`}
            className="aspect-[4/5] w-full object-cover transition-transform duration-300 ease-soft group-hover:scale-[1.02]" />
          
        </button>
        {photos.length > 1 &&
        <div className="grid grid-cols-4 gap-3">
            {photos.map((photo, i) =>
          <button
            key={photo.id}
            onClick={() => setActive(i)}
            aria-label={`Show photo ${i + 1}`}
            className={`overflow-hidden rounded-2xl transition-[box-shadow,opacity] duration-150 ease-soft ${
            i === active ? 'ring-2 ring-berry-500 ring-offset-2 ring-offset-cream' : 'opacity-80 hover:opacity-100'}`
            }>
            
                <img src={photo.url} alt="" className="aspect-square w-full object-cover" />
              </button>
          )}
          </div>
        }
      </div>

      <AnimatePresence>
        {lightbox &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-plum-700/90 p-4">
          
            <button
            onClick={() => setLightbox(false)}
            aria-label="Close gallery"
            className="absolute right-5 top-5 rounded-full bg-cream-deep/10 p-2.5 text-cream transition-colors duration-150 ease-soft hover:bg-cream-deep/20">
            
              <XIcon className="h-5 w-5" />
            </button>
            <button
            onClick={() => setActive((i) => Math.max(0, i - 1))}
            aria-label="Previous"
            className="absolute left-4 rounded-full bg-cream-deep/10 p-3 text-cream disabled:opacity-30"
            disabled={active === 0}>
            
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <motion.img
            key={photos[active].id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            src={photos[active].url}
            alt={`${name}, photo ${active + 1}`}
            className="max-h-[85vh] max-w-full rounded-3xl object-contain" />
          
            <button
            onClick={() => setActive((i) => Math.min(photos.length - 1, i + 1))}
            aria-label="Next"
            className="absolute right-4 rounded-full bg-cream-deep/10 p-3 text-cream disabled:opacity-30"
            disabled={active === photos.length - 1}>
            
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </motion.div>
        }
      </AnimatePresence>
    </>);

}
