'use client';

import React from 'react';
import { Sparkles, MessageSquare, ArrowRight, Star, ShieldCheck, Footprints, Flame, Instagram } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { getWhatsAppUrl, STORE_INSTAGRAM_URL, STORE_INSTAGRAM_HANDLE } from '../../lib/constants';

export const StoreHero: React.FC = () => {
  const { banners } = useStore();

  const WHATSAPP_HERO_URL = getWhatsAppUrl(
    'Olá, Planeta Calçados QB! Gostaria de fazer um pedido ou cotação pelo WhatsApp.'
  );

  const handleScrollToCatalog = () => {
    const el = document.getElementById('catalogo-grade');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden py-12 md:py-16 border-b border-slate-800">
      {/* Background Glowing Rings */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[500px] h-[500px] rounded-full bg-brand-gold/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-[450px] h-[450px] rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Headlines & High-Converting CTAs (7 Cols) */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Top Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Atendimento no WhatsApp • Quatro Barras</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-amber-300 text-xs font-bold shadow-sm">
                <div className="flex text-amber-400">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <Star className="w-3 h-3 fill-amber-400" />
                  <Star className="w-3 h-3 fill-amber-400" />
                  <Star className="w-3 h-3 fill-amber-400" />
                  <Star className="w-3 h-3 fill-amber-400" />
                </div>
                <span>5 Estrelas no Google</span>
              </div>
            </div>

            {/* Main Punchy Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-white">
              O Calçado Ideal Para Você, <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold via-amber-300 to-amber-500 underline decoration-brand-gold decoration-4 underline-offset-8">
                O Planeta aos seus pés.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-slate-300 text-sm sm:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0">
              As melhores marcas de sapatos femininos, tênis esportivos, calçados masculinos e moda com atendimento VIP no WhatsApp. Escolha e receba com rapidez e segurança!
            </p>

            {/* Action Buttons: WhatsApp, Catálogo & Instagram */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              {/* WhatsApp Primary Button */}
              <a
                href={WHATSAPP_HERO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm sm:text-base py-3.5 px-6 rounded-2xl shadow-emerald flex items-center justify-center gap-2.5 transition-all duration-300 hover:scale-105 group cursor-pointer"
              >
                <MessageSquare className="w-5 h-5 fill-slate-950" />
                <span>Pedir pelo WhatsApp Agora</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>

              {/* Browse Catalog Button */}
              <button
                type="button"
                onClick={handleScrollToCatalog}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm py-3.5 px-5 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Footprints className="w-4 h-4 text-brand-gold" />
                <span>Ver Catálogo Pronta Entrega</span>
              </button>

              {/* Instagram Official Channel Button */}
              <a
                href={STORE_INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:from-purple-500 hover:to-rose-400 text-white font-extrabold text-sm py-3.5 px-5 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 cursor-pointer"
                title="Siga a Planeta Calçados no Instagram"
              >
                <Instagram className="w-4 h-4 text-white" />
                <span>Instagram</span>
              </a>
            </div>

            {/* Micro Guarantees */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2 text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Troca Fácil Garantida
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                Pronta Entrega na Loja
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                Preços Imbatíveis
              </span>
            </div>
          </div>

          {/* Right Column: Dynamic Hero Image from Admin (5 Cols) */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            {/* Main Visual Card */}
            <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-700/80 bg-slate-950 group">
              <img
                src={banners.heroBannerImage}
                alt="Calçados em Destaque Planeta Calçados"
                className="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

              {/* Bottom Card Overlay */}
              <div className="absolute bottom-0 inset-x-0 p-5 space-y-2">
                <span className="bg-brand-gold text-slate-950 font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
                  Destaque da Semana
                </span>
                <h3 className="text-lg font-black text-white leading-tight">
                  Coleção Exclusiva de Calçados & Moda
                </h3>
                <p className="text-xs text-slate-300">
                  Modelos selecionados para garantir conforto absoluto o dia todo.
                </p>
              </div>
            </div>

            {/* Floating Trust Badge Top Right */}
            <div className="absolute -top-3 -right-3 sm:right-2 bg-slate-900/90 backdrop-blur-md border border-brand-gold/50 rounded-2xl p-3 shadow-xl hidden sm:flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-slate-400 font-medium">Atendimento</p>
                <p className="text-xs font-black text-white">Online no WhatsApp</p>
              </div>
            </div>

            {/* Floating Store Badge Bottom Left */}
            <div className="absolute -bottom-4 -left-3 sm:left-2 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl p-3 shadow-xl flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold">
                <Star className="w-4 h-4 fill-brand-gold" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-slate-400 font-medium">Quatro Barras - PR</p>
                <p className="text-xs font-black text-brand-gold">5 Estrelas no Google</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
