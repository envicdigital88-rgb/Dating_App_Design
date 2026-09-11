import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils/format';

export function BrandMark({
  className,
  size = 96,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span className={cn('inline-flex items-center justify-center', className)}>
      <Image
        src="/logo.png"
        alt="Wingle Mingle"
        width={size}
        height={size}
        className="rounded-xl object-contain"
        priority
      />
    
    </span>
  );
}