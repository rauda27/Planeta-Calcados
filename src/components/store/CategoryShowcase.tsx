'use client';

import React from 'react';
import { ArrowRight, MessageSquare, Flame } from 'lucide-react';
import { Department } from '../../types';
import { useStore } from '../../context/StoreContext';
import { getWhatsAppUrl } from '../../lib/constants';

interface CategoryShowcaseProps {
  onSelectDepartment: (dept: Department) => void;
}

export const CategoryShowcase: React.FC<CategoryShowcaseProps> = ({ onSelectDepartment }) => {
  const { banners } = useStore();

  const WHATSAPP_URL = getWhatsAppUrl(
    'Olá, Planeta Calçados QB! Gostaria de ver as novidades do catálogo.'
  );

  const categories = [
    {
      id: 'Calçados-Fem',
      title: 'Feminino & Scarpins',
      subtitle: 'Scarpins, sandálias, saltos e rasteiras para brilhar em qualquer ocasião.',
      badge: 'Mais Vendidos',
      dept: 'Calçados' as Department,
      image: banners.femBannerImage,
      whatsappText: 'Olá! Gostaria de ver os modelos de Calçados Femininos e Saltos disponíveis.',
    },
    {
      id: 'Calçados-Tenis',
      title: 'Tênis & Esportivo',
      subtitle: 'Conforto absoluto, amortecimento e estilo para seu dia a dia e treinos.',
      badge: 'Conforto Máximo',
      dept: 'Calçados' as Department,
      image: banners.tenisBannerImage,
      whatsappText: 'Olá! Gostaria de ver as opções de Tênis esportivos e casuais disponíveis.',
    },
    {
      id: 'Calçados-Masc',
      title: 'Masculino & Social',
      subtitle: 'Sapatos sociais, mocassins, botas e sapatênis de alto padrão.',
      badge: 'Elegância & Estilo',
      dept: 'Calçados' as Department,
      image: banners.mascBannerImage,
      whatsappText: 'Olá! Gostaria de ver os calçados masculinos e sapatos sociais disponíveis.',
    },
    {
      id: 'Roupas-Acessorios',
      title: 'Moda, Acessórios & Perfumes',
      subtitle: 'Roupas selecionadas, bolsas, bonés e perfumes para completar seu visual.',
      badge: 'Tendências',
      dept: 'Roupas' as Department,
      image: banners.acessoriosBannerImage,
      whatsappText: 'Olá! Gostaria de ver as novidades de Roupas, Acessórios e Perfumes da loja.',
    },
  ];

  return (
    <section className="py-12 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-gold/15 border border-brand-gold/40 text-brand-dark text-xs font-bold mb-2">
              <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>Destaques da Loja em Quatro Barras</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Escolha seu Estilo • <span className="text-brand-primary">Pronta Entrega</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Clique para navegar no catálogo ou peça atendimento direto com um de nossos vendedores.
            </p>
          </div>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2.5 rounded-xl transition-colors cursor-pointer self-start md:self-auto shrink-0"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Consultar Todas as Numerações no WhatsApp</span>
          </a>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map(cat => (
            <div
              key={cat.id}
              className="group relative rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-slate-200/80 bg-slate-950 flex flex-col justify-end min-h-[380px]"
            >
              {/* Background Lifestyle Image */}
              <img
                src={cat.image}
                alt={cat.title}
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-90"
              />

              {/* Gradient Dark Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

              {/* Badge Top Left */}
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-brand-gold text-slate-950 font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                  {cat.badge}
                </span>
              </div>

              {/* Content Box */}
              <div className="relative z-10 p-5 space-y-3">
                <div>
                  <h3 className="text-lg font-black text-white group-hover:text-brand-gold transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mt-1">
                    {cat.subtitle}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {/* Filter Button */}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectDepartment(cat.dept);
                      const catalogElem = document.getElementById('catalogo-grade');
                      if (catalogElem) catalogElem.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex-1 bg-white/15 hover:bg-white text-white hover:text-slate-950 font-bold py-2 px-3 rounded-xl text-xs backdrop-blur-md transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/20"
                  >
                    <span>Ver Modelos</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {/* WhatsApp Quick Order Button */}
                  <a
                    href={getWhatsAppUrl(cat.whatsappText)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
                    title={`Pedir ${cat.title} no WhatsApp`}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
