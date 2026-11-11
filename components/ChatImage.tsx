'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { EyeIcon, EyeOffIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/lib/contexts/StoreContext';
import { chatImageViewCost } from '@/lib/chat-images';
import type { Mingle } from '@/lib/types';

export function ChatImage({ mingle }: { mingle: Mingle }) {
  const { currentUser, viewImage } = useStore();
  const [openedImage, setOpenedImage] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const openingRef = useRef(false);
  const mine = mingle.senderId === currentUser?.id;
  const expired = !mine && (mingle.deletedFor?.includes(currentUser?.id ?? '') ||
    (mingle.viewOnce && mingle.imageViewCount > 0));
  const cost = mine ? 0 : chatImageViewCost(mingle);

  useEffect(() => {
    if (!openedImage) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenedImage(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openedImage]);

  const openImage = async () => {
    if (openingRef.current || expired) return;
    if (mine) {
      setOpenedImage(mingle.imageUrl || null);
      return;
    }
    if (cost > 0 && !window.confirm(mingle.viewOnce
      ? `Spend ${cost} Wingits to open this one-view photo? You can only open it once.`
      : `Spend ${cost} Wingits to view this photo again?`)) return;

    openingRef.current = true;
    setOpening(true);
    try {
      const result = await viewImage(mingle.id);
      if (result.ok) setOpenedImage(result.data.imageUrl);
      else toast.error(result.error);
    } catch {
      toast.error('Unable to open photo. Please try again.');
    } finally {
      openingRef.current = false;
      setOpening(false);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={opening || expired}
        onClick={event => { event.stopPropagation(); void openImage(); }}
        className={mine && !mingle.viewOnce
          ? `block max-w-full cursor-zoom-in rounded-2xl ${mingle.body ? 'mb-2' : ''}`
          : `flex items-center gap-2 rounded-xl bg-black/20 p-3 text-left disabled:cursor-default disabled:opacity-60 ${mingle.body ? 'mb-2' : ''}`}
        aria-label={mine ? 'View sent photo' : expired ? 'Photo opened' : `View photo (${cost === 0 ? 'Free' : `${cost} Wingits`})`}>
        {mine && !mingle.viewOnce ? (
          <img src={mingle.imageUrl || undefined} alt="Sent photo" className="max-h-72 max-w-full rounded-2xl object-contain" />
        ) : (
          <>
            {expired ? <EyeOffIcon className="h-5 w-5 shrink-0" /> : <EyeIcon className="h-5 w-5 shrink-0" />}
            <span className="text-[14px] font-semibold">
              {opening ? 'Opening…' : mine ? `One-view photo${mingle.imageViewCount > 0 ? ' (Opened)' : ''}`
                : expired ? 'Opened' : mingle.viewOnce ? `Open once (${cost} Wingits)`
                : `Tap to View (${cost === 0 ? 'Free' : `${cost} Wingits`})`}
            </span>
          </>
        )}
      </button>
      {openedImage && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={event => { event.stopPropagation(); setOpenedImage(null); }}>
          <button
            type="button"
            aria-label="Close photo"
            className="absolute right-4 top-4 rounded-full p-2 text-white hover:bg-white/10"
            onClick={event => { event.stopPropagation(); setOpenedImage(null); }}>
            <XIcon className="h-6 w-6" />
          </button>
          <img src={openedImage} alt="Shared photo" className="max-h-full max-w-full object-contain" onClick={event => event.stopPropagation()} />
        </div>, document.body,
      )}
    </>
  );
}
