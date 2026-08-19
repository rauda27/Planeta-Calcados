'use client';

import React from 'react';
import { Product } from '../../types';
import { ProductCard } from './ProductCard';
import { Footprints, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface ProductGridProps {
  products: Product[];
  onSelectProduct: (p: Product) => void;
  onResetFilters: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onSelectProduct,
  onResetFilters,
}) => {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-soft flex flex-col items-center justify-center my-6">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
          <Footprints className="w-8 h-8 text-brand-primary/40" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Nenhum calçado encontrado</h3>
        <p className="text-sm text-slate-500 max-w-md mt-1 mb-6">
          Não encontramos nenhum produto com a combinação de filtros e numeração selecionada. Tente ajustar ou limpar seus filtros.
        </p>
        <Button variant="outline" onClick={onResetFilters}>
          Limpar Filtros de Busca
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Items count bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Exibindo <strong>{products.length}</strong> calçados no catálogo</span>
        <span>Planeta Calçados • Pronta Entrega</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onSelect={onSelectProduct}
          />
        ))}
      </div>
    </div>
  );
};
