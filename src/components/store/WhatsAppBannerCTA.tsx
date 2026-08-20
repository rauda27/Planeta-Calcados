import React from 'react';
import { MessageSquare, CheckCircle2, ArrowRight, ShieldCheck, Instagram } from 'lucide-react';
import { getWhatsAppUrl, STORE_PHONE_FORMATTED, STORE_INSTAGRAM_URL, STORE_INSTAGRAM_HANDLE } from '../../lib/constants';

export const WhatsAppBannerCTA: React.FC = () => {
  const WHATSAPP_URL = getWhatsAppUrl(
    'Olá, Planeta Calçados QB! Estou no site e gostaria de ajuda para escolher um calçado no meu tamanho.'
  );

  return (
    <section className="my-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-950 via-emerald-950 to-brand-primary p-8 sm:p-12 shadow-2xl border border-emerald-500/30 flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Background Decorative Glow */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-brand-gold/15 blur-3xl pointer-events-none" />

          {/* Left Text & Persuasion Triggers */}
          <div className="relative z-10 max-w-2xl space-y-4 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Atendimento Online Disponível Agora</span>
            </div>

            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
              Não achou seu tamanho ou quer um modelo exclusivo?
            </h3>

            <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
              Fale direto com nossa equipe da loja física em Quatro Barras! Enviamos fotos dos modelos disponíveis em estoque, tiramos dúvidas sobre formas e separamos o seu calçado na hora.
            </p>

            {/* Checklist of advantages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-emerald-100 font-medium">
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <CheckCircle2 className="w-4 h-4 text-brand-gold shrink-0" />
                <span>Atendimento humanizado e personalizado</span>
              </div>
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <CheckCircle2 className="w-4 h-4 text-brand-gold shrink-0" />
                <span>Fotos e vídeos reais dos calçados</span>
              </div>
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <CheckCircle2 className="w-4 h-4 text-brand-gold shrink-0" />
                <span>Retirada na loja ou entrega rápida</span>
              </div>
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <CheckCircle2 className="w-4 h-4 text-brand-gold shrink-0" />
                <span>Pagamento facilitado no PIX ou Cartão</span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons: WhatsApp & Instagram */}
          <div className="relative z-10 shrink-0 flex flex-col items-center gap-3 w-full sm:w-auto">
            {/* WhatsApp Main Button */}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm sm:text-base py-3.5 px-7 rounded-2xl shadow-emerald flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 group cursor-pointer"
            >
              <MessageSquare className="w-5 h-5 fill-slate-950" />
              <span>Chamar no WhatsApp {STORE_PHONE_FORMATTED}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </a>

            {/* Instagram Secondary Button */}
            <a
              href={STORE_INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:from-purple-500 hover:to-rose-400 text-white font-black text-sm sm:text-base py-3.5 px-7 rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 cursor-pointer"
            >
              <Instagram className="w-5 h-5 text-white" />
              <span>Seguir {STORE_INSTAGRAM_HANDLE} no Instagram</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <div className="flex items-center gap-2 text-[11px] text-slate-300 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Atendimento ágil & Novidades diárias no feed</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
