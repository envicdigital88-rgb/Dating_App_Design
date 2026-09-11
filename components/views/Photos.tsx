'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeftIcon, ArrowRightIcon, ImageIcon, StarIcon, Trash2Icon } from 'lucide-react';
import { Page, PageHeader } from '@/components/AppShell';
import { PhotoUploader } from '@/components/PhotoUploader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Bits';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/lib/contexts/StoreContext';
import { shortDate } from '@/lib/utils/format';

const MAX_PHOTOS = 6;

export function Photos() {
  const { currentUser, db, addPhoto, deletePhoto, setPrimaryPhoto, movePhoto } = useStore();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  if (!currentUser) return null;

  const photos = db.photos.
  filter((p) => p.userId === currentUser.id).
  sort((a, b) => a.order - b.order);

  return (
    <Page>
      <PageHeader
        title="My photos"
        body={`Your main photo is what people see in Discover. Up to ${MAX_PHOTOS} photos, cropped and compressed automatically.`} />
      

      <div className="max-w-4xl">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {photos.map((photo, index) =>
          <li key={photo.id} className="overflow-hidden rounded-4xl bg-cream-deep shadow-card">
              <div className="relative">
                <img
                src={photo.url}
                alt={`Your photo ${index + 1}`}
                className="aspect-[3/4] w-full object-cover" />
              
                <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
                  {photo.isPrimary &&
                <span className="inline-flex items-center gap-1 rounded-full bg-cream-deep/95 px-2.5 py-1 text-[11px] font-semibold text-ink">
                      <StarIcon className="h-3 w-3 text-berry-500" fill="currentColor" />
                      Main
                    </span>
                }
                  {photo.moderation === 'pending' && <Badge tone="amber">In review</Badge>}
                </div>
              </div>
              <div className="p-3">
                <p className="text-[12px] text-ink-muted">Added {shortDate(photo.uploadedAt)}</p>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <button
                  onClick={() => movePhoto(photo.id, -1)}
                  disabled={index === 0}
                  aria-label="Move photo earlier"
                  className="rounded-full border border-sand p-2 text-ink-soft transition-colors duration-150 ease-soft hover:border-berry-300 disabled:opacity-40">
                  
                    <ArrowLeftIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                  onClick={() => movePhoto(photo.id, 1)}
                  disabled={index === photos.length - 1}
                  aria-label="Move photo later"
                  className="rounded-full border border-sand p-2 text-ink-soft transition-colors duration-150 ease-soft hover:border-berry-300 disabled:opacity-40">
                  
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </button>
                  {!photo.isPrimary &&
                <button
                  onClick={() => {
                    setPrimaryPhoto(photo.id);
                    toast.success('Main photo updated');
                  }}
                  className="flex-1 rounded-full border border-sand py-2 text-[12px] font-medium text-ink-soft transition-colors duration-150 ease-soft hover:border-berry-300 hover:text-berry-600">
                  
                      Make main
                    </button>
                }
                  <button
                  onClick={() => setPendingDelete(photo.id)}
                  aria-label="Delete photo"
                  className="rounded-full border border-red-200 p-2 text-red-600 transition-colors duration-150 ease-soft hover:bg-red-50">
                  
                    <Trash2Icon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </li>
          )}

          {photos.length < MAX_PHOTOS &&
          <li>
              <PhotoUploader
              onPhotos={(urls) => {
                urls.slice(0, MAX_PHOTOS - photos.length).forEach(addPhoto);
                toast.success('Photos uploaded — moderation will review them shortly');
              }}
              label="Upload photos" />
            
            </li>
          }
        </ul>

        <div className="mt-8 grid gap-4 rounded-4xl border border-sand bg-cream-deep p-6 sm:grid-cols-3">
          {[
          {
            title: 'One clear face photo',
            body: 'Your main photo should be you, alone, looking at the camera.'
          },
          {
            title: 'Show your life',
            body: 'A second and third photo doing something you actually do gets more wingles.'
          },
          {
            title: 'Reviewed before live',
            body: 'New photos sit in review briefly. Anything inappropriate is removed.'
          }].
          map((tip) =>
          <div key={tip.title}>
              <h3 className="flex items-center gap-2 font-display text-[17px] text-ink">
                <ImageIcon className="h-4 w-4 text-berry-500" />
                {tip.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{tip.body}</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Delete this photo?"
        description="It will be removed from your profile and gallery immediately."
        footer={
        <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
            variant="danger"
            onClick={() => {
              deletePhoto(pendingDelete as string);
              setPendingDelete(null);
              toast.success('Photo deleted');
            }}>
            
              Delete photo
            </Button>
          </>
        } />
      
    </Page>);

}
