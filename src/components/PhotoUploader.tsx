'use client';

import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { ImagePlusIcon, Loader2Icon } from 'lucide-react';
import { processPhoto, screenPhoto } from '../utils/image';

export function PhotoUploader({
  onPhotos,
  label = 'Add photos',
  hint = 'JPG or PNG · cropped and compressed automatically',
  className





}: {onPhotos: (urls: string[]) => void;label?: string;hint?: string;className?: string;}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const screen = screenPhoto(file);
      if (!screen.ok) {
        toast.error(screen.error as string);
        continue;
      }
      try {
        urls.push(await processPhoto(file));
      } catch {
        toast.error(`We could not process ${file.name}.`);
      }
    }
    setBusy(false);
    if (urls.length) onPhotos(urls);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handle(e.target.files)} />
      
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-sand bg-white/70 px-4 text-center transition-[border-color,background-color] duration-150 ease-soft hover:border-berry-300 hover:bg-white disabled:opacity-60">
        
        {busy ?
        <Loader2Icon className="h-5 w-5 animate-spin text-berry-500" /> :

        <ImagePlusIcon className="h-5 w-5 text-berry-500" />
        }
        <span className="text-[13px] font-medium text-ink">{busy ? 'Processing…' : label}</span>
        <span className="text-[11px] leading-snug text-ink-muted">{hint}</span>
      </button>
    </div>);

}