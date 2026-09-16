'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/format';

const base =
'w-full rounded-2xl border border-sand bg-cream-deep px-4 text-sm text-ink placeholder:text-ink-muted/70 transition-[border-color,box-shadow] duration-150 ease-soft focus:border-berry-400 focus:outline-none focus:ring-2 focus:ring-berry-100';

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
  value,
  onChange,
  disabled,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const options: { label: React.ReactNode; value: string; disabled?: boolean }[] = [];
  let displayLabel: React.ReactNode = '';

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === 'option') {
      const val = child.props.value ?? child.props.children;
      const label = child.props.children;
      const isDisabled = child.props.disabled;
      options.push({ label, value: val, disabled: isDisabled });
      if (val === value) {
        displayLabel = label;
      }
    }
  });

  const handleSelect = (val: string) => {
    setIsOpen(false);
    if (onChange) {
      const e = {
        target: { value: val, name: rest.name }
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange(e);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className={cn(base, 'h-12 flex items-center justify-between text-left', className)}
      >
        <span className={cn("truncate pr-2", !value ? 'text-ink-muted/70' : 'text-ink')}>
          {displayLabel || 'Select an option...'}
        </span>
        <svg className="w-4 h-4 text-ink-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[100] flex flex-col justify-end">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative bg-cream-deep w-full rounded-t-3xl p-6 pb-12 max-h-[85vh] overflow-y-auto shadow-2xl"
              >
                <div className="mx-auto w-12 h-1.5 bg-sand rounded-full mb-6" />
                <div className="flex flex-col gap-2">
                  {options.map((opt, i) => (
                    <button
                      key={opt.value + i}
                      disabled={opt.disabled}
                      onClick={() => !opt.disabled && handleSelect(opt.value)}
                      className={cn(
                        "w-full text-left px-5 py-4 rounded-2xl text-[16px] transition-colors",
                        opt.value === value ? "bg-berry-500 text-white font-medium shadow-md" : "bg-sand/30 text-ink hover:bg-sand/60",
                        opt.disabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

export function FieldError({ children }: {children?: React.ReactNode;}) {
  if (!children) return null;
  return <p className="mt-1.5 text-[13px] text-red-600">{children}</p>;
}
