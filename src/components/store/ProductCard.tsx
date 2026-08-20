'use client';

import React from 'react';
import { Product } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ShoppingBag, Eye, MessageSquare } from 'lucide-react';
import { Button } from '../ui/Button';
import { getWhatsAppUrl } from '../../lib/constants';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const availableSizes = Array.from(
    new Set(
      product.variants
        .filter(v => v.stock > 0)
        .map(v => v.size)
    )
  );

  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const hasDiscount = !!(product.promoPrice && product.promoPrice < product.salePrice);
  const displayPrice = product.promoPrice || product.salePrice;

  const directWhatsappUrl = getWhatsAppUrl(
    `Olá, Planeta Calçados QB! Gostaria de cotar o produto: ${product.name} (Marca: ${product.brand} | SKU: ${product.sku}) - R$ ${displayPrice.toFixed(2).replace('.', ',')}`
  );

  return (
    <Card className="group flex flex-col h-full hover:border-brand-primary/40 transition-all duration-300 shadow-soft hover:shadow-lg">
      {/* Product Image Box */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden cursor-pointer" onClick={() => onSelect(product)}>
        <img
          src={product.images?.[0] || 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&auto=format&fit=crop&q=60'}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          {hasDiscount && (
            <Badge variant="gold" size="sm" className="shadow-xs font-bold">
              OFERTA
            </Badge>
          )}
          <Badge variant="default" size="sm" className="bg-white/90 backdrop-blur-xs font-medium text-slate-800">
            {product.brand}
          </Badge>
        </div>

        {/* Stock Status Badge */}
        <div className="absolute top-3 right-3 z-10">
          {totalStock === 0 ? (
            <Badge variant="danger" size="sm">
              Esgotado
            </Badge>
          ) : totalStock <= 3 ? (
            <Badge variant="warning" size="sm">
              Poucas unidades
            </Badge>
          ) : null}
        </div>

        {/* Quick View Hover Overlay */}
        <div className="absolute inset-0 bg-slate-900/25 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
          <span className="px-3.5 py-2 rounded-full bg-white text-slate-900 font-bold text-xs shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5 text-brand-primary" />
            Ver Tamanhos
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {product.department || 'Calçados'} • {product.category}
          </div>
          <h3
            onClick={() => onSelect(product)}
            className="font-bold text-slate-900 text-sm line-clamp-1 hover:text-brand-primary transition-colors cursor-pointer"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Sizes Chips Preview */}
          <div className="mt-2.5">
            <span className="text-[10px] font-semibold text-slate-400 block mb-1">
              Tamanhos em estoque:
            </span>
            <div className="flex flex-wrap gap-1">
              {availableSizes.length > 0 ? (
                availableSizes.map(size => (
                  <span
                    key={String(size)}
                    className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {size}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-rose-500 italic">Sem numeração disponível</span>
              )}
            </div>
          </div>
        </div>

        {/* Pricing & High-Converting WhatsApp CTAs */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Preço à vista</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-brand-primary">
                R$ {displayPrice.toFixed(2).replace('.', ',')}
              </span>
              {hasDiscount && (
                <span className="text-xs text-slate-400 line-through">
                  R$ {product.salePrice.toFixed(2).replace('.', ',')}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSelect(product)}
              icon={<ShoppingBag className="w-3.5 h-3.5 text-brand-primary" />}
              className="text-xs font-bold"
            >
              Escolher
            </Button>

            {/* Direct WhatsApp High-Converting Action */}
            <a
              href={directWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
              title="Cotar este produto direto no WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5 text-white" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
};
