'use client';

import React from 'react';

interface StoreLogoProps {
  variant?: 'light' | 'dark' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StoreLogo: React.FC<StoreLogoProps> = ({
  variant = 'light',
  size = 'md',
  className = '',
}) => {
  const isLight = variant === 'light';

  const titleSizes = {
    sm: 'text-sm sm:text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl sm:text-3xl',
  };

  const sloganSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
  };

  return (
    <div className={`inline-flex flex-col bg-transparent select-none shrink-0 ${className}`}>
      {/* ONLY TYPOGRAPHY (NO GRAPHIC ICON/EMBLEM) AS BEFORE */}
      <h1 className={`${titleSizes[size]} font-black tracking-tight leading-none ${isLight ? 'text-white' : 'text-slate-900'}`}>
        PLANETA <span className="text-brand-gold font-light">CALÇADOS</span>
      </h1>
      <p className={`${sloganSizes[size]} tracking-wider font-semibold uppercase mt-0.5 ${isLight ? 'text-brand-gold/90' : 'text-emerald-800'}`}>
        O Planeta aos seus pés
      </p>
    </div>
  );
};
