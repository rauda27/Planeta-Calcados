'use client';

import React from 'react';
import { MessageSquare, MapPin, ShieldCheck, Zap, CreditCard, Sparkles } from 'lucide-react';

export const TrustBar: React.FC = () => {
  return (
    <section className="bg-slate-900 text-white border-y border-slate-800 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Item 1: WhatsApp */}
          <div className="flex items-center gap-3.5 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 hover:border-emerald-500/50 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-xs">Pedido Direto no WhatsApp</h4>
              <p className="text-[11px] text-slate-400">Atendimento rápido com fotos e vídeos reais</p>
            </div>
          </div>

          {/* Item 2: Loja Física */}
          <div className="flex items-center gap-3.5 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 hover:border-brand-gold/50 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-xs">Loja Física em Quatro Barras</h4>
              <p className="text-[11px] text-slate-400">Av. Dom Pedro II, 96 - Centro</p>
            </div>
          </div>

          {/* Item 3: Pagamento Facilitado */}
          <div className="flex items-center gap-3.5 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 hover:border-brand-primary/50 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-xs">PIX, Cartão & Crediário</h4>
              <p className="text-[11px] text-slate-400">Facilidade de pagamento na loja ou online</p>
            </div>
          </div>

          {/* Item 4: Garantia & Confiança */}
          <div className="flex items-center gap-3.5 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 hover:border-emerald-500/50 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-brand-gold/20 text-brand-gold flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-xs">Troca Garantida & Segurança</h4>
              <p className="text-[11px] text-slate-400">5 Estrelas de Avaliação no Google</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
