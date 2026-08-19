import React, { HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'gold' | 'emerald' | 'danger' | 'warning' | 'success' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full transition-colors';

  const variants = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    gold: 'bg-amber-50 text-amber-800 border border-amber-200 font-semibold',
    emerald: 'bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200 font-medium',
    warning: 'bg-amber-100 text-amber-900 border border-amber-300 font-medium',
    success: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-medium',
    outline: 'border border-slate-300 text-slate-600 bg-transparent',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      {...props}
    >
      {children}
    </span>
  );
};
