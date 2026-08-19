'use client';

import React from 'react';
import { Phone, MapPin, Mail, Clock, CreditCard, Heart, ShieldCheck, Star } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-gold flex items-center justify-center text-slate-900 font-bold">
                P
              </div>
              <h3 className="text-white font-bold text-base tracking-wide">
                PLANETA <span className="text-brand-gold">CALÇADOS QB</span>
              </h3>
            </div>
            <p className="text-slate-400 text-xs italic">"O Planeta aos seus pés"</p>
            <p className="text-slate-400 leading-relaxed text-xs">
              Sua loja de calçados, moda e acessórios em Quatro Barras - PR. Trabalhamos com as melhores marcas com atendimento personalizado via WhatsApp.
            </p>

            {/* Google Rating 5.0 */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200 text-[11px]">
              <div className="flex text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <Star className="w-3.5 h-3.5 fill-amber-400" />
              </div>
              <span className="font-bold text-white">5,0 no Google</span>
              <span className="text-slate-400">(6 avaliações)</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold uppercase tracking-wider text-xs">Departamentos</h4>
            <ul className="space-y-2">
              <li><span className="hover:text-white transition-colors cursor-pointer">Calçados Femininos & Masculinos</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Tênis Esportivos & Casuais</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Sapatos Sociais & Scarpins</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Roupas & Vestuário</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Acessórios & Perfumes</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold uppercase tracking-wider text-xs">Localização & Contato</h4>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                <div className="text-slate-300">
                  <span className="font-semibold text-white block">Loja Física Quatro Barras</span>
                  <span>Av. Dom Pedro II, 96 - Centro</span><br />
                  <span>Quatro Barras - PR, 83420-000</span>
                </div>
              </li>
              <li className="flex items-center gap-2 pt-1">
                <Phone className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                <span>(11) 99999-8888 (WhatsApp)</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                <span>contato@planetacalcados4b.com.br</span>
              </li>
            </ul>
          </div>

          {/* Business Hours & Trust Info */}
          <div className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700/40">
            <h4 className="text-white font-semibold uppercase tracking-wider text-xs flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand-gold" />
              Horário de Funcionamento
            </h4>
            <div className="text-[11px] text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span>Segunda a Sexta:</span>
                <strong className="text-white">09:00 às 18:00</strong>
              </div>
              <div className="flex justify-between">
                <span>Sábado:</span>
                <strong className="text-white">09:00 às 17:00</strong>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Domingo:</span>
                <strong>Fechado</strong>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-700/50 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                <CreditCard className="w-3.5 h-3.5 text-brand-gold" />
                <span>PIX, Cartões e Crediário</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Garantia & Compra Segura</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>© 2026 Planeta Calçados QB - Quatro Barras, PR. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1">
            Desenvolvido com <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> para Planeta Calçados QB
          </p>
        </div>
      </div>
    </footer>
  );
};
