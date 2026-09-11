import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils/format';

export function BrandMark({
  className,
  size = 80,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span className={cn('inline-flex items-center justify-center', className)}>
      <Image
        src="https://res.cloudinary.com/dax2b5to5/image/upload/v1789137182/logo_gwl8ju.png"
        alt="Wingle Mingle"
        width={size}
        height={size}
        className="object-contain"
        priority
      />
    
    </span>
  );
}