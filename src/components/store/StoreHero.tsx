'use client';

import React from 'react';
import { Sparkles, MessageSquare, Truck, Award, Footprints } from 'lucide-react';
import { ProductCategory } from '../../types';

interface StoreHeroProps {
  selectedCategory: ProductCategory | 'Todas';
  onSelectCategory: (cat: ProductCategory | 'Todas') => void;
}

const CATEGORIES: (ProductCategory | 'Todas')[] = [
  'Todas',
  'Tênis',
  'Sapato Social',
  'Scarpin',
  'Rasteira',
  'Sandália',
  'Bota',
  'Polos',
  'Bonés',
  'Perfumes',
];

export const StoreHero: React.FC<StoreHeroProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <section className="relative bg-gradient-to-b from-brand-primary/10 via-white to-slate-50 border-b border-slate-100 py-10 md:py-14 overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-brand-gold/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-brand-primary/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl">
          {/* Tag */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-brand-primary text-xs font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-brand-gold fill-brand-gold" />
              <span>Coleção Primavera / Verão 2026</span>
            </div>

            {/* Google 5.0 Review Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-slate-800 text-xs font-bold shadow-xs">
              <span className="text-amber-500">★★★★★</span>
              <span>5,0 no Google</span>
              <span className="text-slate-500 font-normal">(6 avaliações em Quatro Barras - PR)</span>
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Elegância, Conforto & Estilo: <br />
            <span className="text-brand-primary underline decoration-brand-gold decoration-4 underline-offset-4">
              O Planeta aos seus pés.
            </span>
          </h2>

          <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl">
            Sua loja de calçados e moda em Quatro Barras - PR. Explore nossa seleção exclusiva das melhores marcas e finalize seu pedido com atendimento direto via WhatsApp.
          </p>

          {/* Feature Badges */}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700">
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Cotação Rápida via WhatsApp</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
              <Award className="w-4 h-4 text-brand-gold" />
              <span>Loja Física em Quatro Barras</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
              <Truck className="w-4 h-4 text-brand-primary" />
              <span>Entregas Rápidas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-slate-200/60">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 shrink-0 flex items-center gap-1">
            <Footprints className="w-3.5 h-3.5 text-brand-primary" />
            Categorias:
          </span>
          {CATEGORIES.map(category => {
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => onSelectCategory(category)}
                className={`px-4 py-2 text-xs font-medium rounded-full transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-brand-primary text-white shadow-sm ring-2 ring-brand-gold/50'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
