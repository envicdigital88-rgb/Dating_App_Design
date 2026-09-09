import React from 'react';
import { cn } from '@/lib/utils/format';

const base =
'w-full rounded-2xl border border-sand bg-white px-4 text-sm text-ink placeholder:text-ink-muted/70 transition-[border-color,box-shadow] duration-150 ease-soft focus:border-berry-400 focus:outline-none focus:ring-2 focus:ring-berry-100';

export function Label({ children, htmlFor }: {children: React.ReactNode;htmlFor?: string;}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-ink-soft">
      {children}
    </label>);

}

export function Input({
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={cn(base, 'h-12', className)} />;
}

export function Textarea({
  className,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={cn(base, 'min-h-[110px] py-3 leading-relaxed', className)} />;
}

export function Select({
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={cn(base, 'h-12 appearance-none pr-10', className)}>
      {children}
    </select>);

}

export function FieldError({ children }: {children?: React.ReactNode;}) {
  if (!children) return null;
  return <p className="mt-1.5 text-[13px] text-red-600">{children}</p>;
}