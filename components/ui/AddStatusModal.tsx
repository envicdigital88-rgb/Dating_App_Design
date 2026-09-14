import React, { useState } from 'react';
import { XIcon, UploadIcon, CameraIcon } from 'lucide-react';
import { Button } from './Button';
import { seedPhotos } from '@/lib/data/seed';
import { useStore } from '@/lib/contexts/StoreContext';

const demoImages = seedPhotos.slice(0, 4).map(p => p.url);

export function AddStatusModal({ onClose }: { onClose: () => void }) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const { addStatus } = useStore();

  const handlePost = () => {
    if (selectedPhoto) {
      addStatus(selectedPhoto);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex overflow-y-auto bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md m-auto overflow-hidden rounded-3xl bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h3 className="text-lg font-semibold text-white">Add to Status</h3>
          <button onClick={onClose} className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!selectedPhoto ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-10 text-center">
                <CameraIcon className="h-10 w-10 text-white/40" />
                <p className="text-sm text-white/70">For this demo, please select one of the test images below to simulate uploading a photo.</p>
              </div>
              
              <div>
                <p className="mb-3 text-sm font-medium text-white/80">Select a demo photo:</p>
                <div className="grid grid-cols-2 gap-3">
                  {demoImages.map((url) => (
                    <button
                      key={url}
                      onClick={() => setSelectedPhoto(url)}
                      className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-white/10"
                    >
                      <img src={url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-white/20">
                <img src={selectedPhoto} alt="Selected status" className="h-full w-full object-cover" />
                <button 
                  onClick={() => setSelectedPhoto(null)}
                  className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white backdrop-blur-md hover:bg-black/70"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
              
              <Button onClick={handlePost} className="w-full justify-center gap-2 py-4">
                <UploadIcon className="h-5 w-5" />
                Post Status
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
