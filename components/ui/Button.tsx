import React from 'react';
import { Loader2Icon } from 'lucide-react';
import { cn } from '@/lib/utils/format';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'inverse';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'bg-berry-500 text-white hover:bg-berry-600 shadow-sm',
  secondary: 'bg-plum-500 text-cream hover:bg-plum-600',
  ghost: 'text-ink-soft hover:bg-cream-deep',
  outline: 'border border-sand bg-white text-ink hover:border-berry-300 hover:text-berry-600',
  danger: 'border border-red-200 bg-white text-red-700 hover:bg-red-50',
  inverse: 'bg-cream text-plum-500 hover:bg-white'
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-[52px] px-7 text-[15px]'
};

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  block = false,
  className,
  children,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-[-0.01em]',
        'transition-[background-color,color,border-color,transform,box-shadow] duration-150 ease-soft',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-berry-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
        'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        block && 'w-full',
        className
      )}>
      
      {loading && <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>);

}