'use client';

import React, { useState } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';

export const WhatsAppFloatingCTA: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const STORE_PHONE = '5511999998888';
  const whatsappUrl = `https://wa.me/${STORE_PHONE}?text=${encodeURIComponent(
    'Olá, equipe Planeta Calçados! Gostaria de tirar dúvidas sobre produtos, numerações e cotação de entrega.'
  )}`;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 select-none">
      {/* Expanded Conversion Popover */}
      {isOpen && (
        <div className="bg-white rounded-2xl p-4 shadow-2xl border border-emerald-200 w-80 animate-in slide-in-from-bottom-5 duration-300 relative">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0 relative">
              <MessageSquare className="w-5 h-5" />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white animate-ping" />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                Planeta Calçados — WhatsApp
                <Sparkles className="w-3 h-3 text-brand-gold" />
              </h4>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Atendimento Online • Resposta Rápida
              </span>
            </div>
          </div>

          {/* Body message */}
          <div className="py-3 text-xs text-slate-600 leading-relaxed bg-emerald-50/50 p-2.5 rounded-xl my-2 border border-emerald-100/60">
            👋 Olá! Precisa de ajuda para escolher a numeração correta ou cotar frete para sua cidade? Fale direto conosco no WhatsApp!
          </div>

          {/* Direct Launch Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-emerald transition-all duration-200 group cursor-pointer"
          >
            <Send className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
            <span>Iniciar Conversa no WhatsApp</span>
          </a>
        </div>
      )}

      {/* Pulsing Floating Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center border-2 border-white ring-4 ring-emerald-500/20 cursor-pointer"
        title="Falar no WhatsApp"
      >
        <MessageSquare className="w-7 h-7 text-white" />
        
        {/* Pulse ring indicator */}
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-gold border-2 border-white animate-bounce" />

        {/* Hover Tooltip Label */}
        <span className="absolute right-full mr-3 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
          💬 Nos chame no WhatsApp!
        </span>
      </button>
    </div>
  );
};
