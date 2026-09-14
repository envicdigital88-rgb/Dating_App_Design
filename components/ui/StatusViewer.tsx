'use client';

import React, { useState, useEffect } from 'react';
import { XIcon } from 'lucide-react';
import { useStore } from '@/lib/contexts/StoreContext';
import { Avatar } from './Bits';

export function StatusViewer({ userId, onClose }: { userId: string, onClose: () => void }) {
  const { userById, statusesOf } = useStore();
  const statuses = statusesOf(userId);
  const user = userById(userId);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (statuses.length === 0) {
      onClose();
    }
  }, [statuses.length, onClose]);
  
  useEffect(() => {
    if (statuses.length === 0) return;
    
    const timer = setInterval(() => {
      if (currentIndex < statuses.length - 1) {
        setCurrentIndex(c => c + 1);
      } else {
        onClose();
      }
    }, 5000);
    
    return () => clearInterval(timer);
  }, [currentIndex, statuses.length, onClose]);
  
  if (!user || statuses.length === 0) return null;
  
  const status = statuses[currentIndex];
  
  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, currentTarget } = e;
    const { left, width } = currentTarget.getBoundingClientRect();
    const isLeft = clientX - left < width / 3;
    
    if (isLeft) {
      if (currentIndex > 0) setCurrentIndex(c => c - 1);
    } else {
      if (currentIndex < statuses.length - 1) setCurrentIndex(c => c + 1);
      else onClose();
    }
  };
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <style>{`
        @keyframes fillProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-fill-progress {
          animation: fillProgress 5s linear forwards;
        }
      `}</style>
      
      <div 
        className="relative h-full max-h-[900px] w-full max-w-[450px] bg-zinc-900 cursor-pointer overflow-hidden lg:rounded-[2rem] lg:h-[90vh]" 
        onClick={handleTap}
      >
        <img 
          key={status.id} // Forces re-render of image and animation
          src={status.photoUrl} 
          alt="Status" 
          className="h-full w-full object-cover"
        />
        
        {/* Top Overlay */}
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent p-4 pb-12 pointer-events-none">
          {/* Progress Bars */}
          <div className="flex gap-1 mb-4">
            {statuses.map((s, i) => (
              <div key={s.id} className="h-1 flex-1 bg-white/30 overflow-hidden rounded-full">
                <div 
                  key={currentIndex} // Force re-animation when current index changes
                  className={`h-full bg-white ${i < currentIndex ? 'w-full' : i === currentIndex ? 'animate-fill-progress' : 'w-0'}`}
                />
              </div>
            ))}
          </div>
          
          {/* User Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar src={user.photos?.[0] || ''} name={user.name} />
              <span className="font-semibold text-white drop-shadow-md">{user.name}</span>
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }} 
              className="p-2 text-white hover:bg-white/20 rounded-full transition-colors pointer-events-auto"
            >
              <XIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
