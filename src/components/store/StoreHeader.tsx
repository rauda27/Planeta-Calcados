'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, Compass, SlidersHorizontal, MessageSquare } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { StoreLogo } from '../ui/StoreLogo';

interface StoreHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggleMobileFilter?: () => void;
}

export const StoreHeader: React.FC<StoreHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onToggleMobileFilter,
}) => {
  const { cart, setIsCartOpen } = useStore();
  const totalItemsInCart = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-brand-primary text-white shadow-md">
      {/* Top Banner */}
      <div className="bg-brand-dark/80 text-brand-gold text-[11px] font-medium py-1.5 px-4 text-center border-b border-brand-gold/20 flex items-center justify-center gap-4 overflow-hidden">
        <span className="flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-brand-gold" />
          <span>Planeta Calçados QB — <strong>"O Planeta aos seus pés"</strong></span>
        </span>
        <span className="hidden md:inline text-white/30">•</span>
        <span className="hidden md:inline text-slate-200">
          Loja em Quatro Barras - PR • Atendimento Direto via WhatsApp
        </span>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo in Transparent PNG / SVG format */}
        <Link href="/" className="group shrink-0">
          <StoreLogo variant="light" size="md" className="group-hover:scale-105 transition-transform duration-200" />
        </Link>

        {/* Minimalist Search Bar */}
        <div className="flex-1 max-w-lg hidden sm:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por modelo, marca (ex: Vizzano, Olympikus, Ferracini)..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder:text-slate-300 focus:placeholder:text-slate-400 rounded-full pl-10 pr-4 py-2 text-sm transition-all duration-200 outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-brand-gold"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-white/20 text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-white/40"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Mobile Filter Toggle */}
          {onToggleMobileFilter && (
            <button
              onClick={onToggleMobileFilter}
              className="sm:hidden p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
              title="Filtros"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          )}

          {/* WhatsApp Direct Conversion Header Button */}
          <a
            href="https://wa.me/5541991543389?text=Ol%C3%A1%2C%20Planeta%20Cal%C3%A7ados%20QB!%20Gostaria%20de%20falar%20com%20um%20vendedor%20e%20fazer%20uma%20cota%C3%A7%C3%A3o."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer"
            title="Atendimento Direto no WhatsApp"
          >
            <MessageSquare className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>

          {/* Cart Button with Counter */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-950/70 border border-brand-gold/30 text-white transition-all duration-200 group cursor-pointer"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-brand-gold group-hover:scale-110 transition-transform" />
              {totalItemsInCart > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-gold text-slate-950 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                  {totalItemsInCart}
                </span>
              )}
            </div>
            <span className="text-xs font-semibold hidden md:inline">Cotação</span>
          </button>

        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="sm:hidden px-4 pb-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar calçado..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white/10 text-white placeholder:text-slate-300 rounded-full pl-10 pr-4 py-2 text-sm outline-none ring-1 ring-white/20"
          />
        </div>
      </div>
    </header>
  );
};
