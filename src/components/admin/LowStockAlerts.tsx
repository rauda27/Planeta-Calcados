'use client';

import React from 'react';
import { useStore } from '../../context/StoreContext';
import { AlertTriangle, PlusCircle, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface LowStockAlertsProps {
  onEditProduct: (productId: string) => void;
}

export const LowStockAlerts: React.FC<LowStockAlertsProps> = ({ onEditProduct }) => {
  const { products } = useStore();

  // Find all variants with stock <= minStock
  const lowStockItems: Array<{
    productId: string;
    productName: string;
    brand: string;
    variantId: string;
    size: number;
    color: string;
    stock: number;
    minStock: number;
    shelfLocation: string;
  }> = [];

  products.forEach(product => {
    product.variants.forEach(variant => {
      if (variant.stock <= variant.minStock) {
        lowStockItems.push({
          productId: product.id,
          productName: product.name,
          brand: product.brand,
          variantId: variant.id,
          size: variant.size,
          color: variant.color,
          stock: variant.stock,
          minStock: variant.minStock,
          shelfLocation: variant.shelfLocation,
        });
      }
    });
  });

  if (lowStockItems.length === 0) return null;

  return (
    <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-5 mb-6 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 animate-bounce" />
          <h3 className="font-bold text-amber-900 text-sm">
            Alertas de Estoque Mínimo Atingido ({lowStockItems.length} numerações críticas)
          </h3>
        </div>
        <span className="text-xs text-amber-800 font-medium">Revisão necessária para pedido ao fornecedor</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {lowStockItems.slice(0, 6).map((item, idx) => (
          <div
            key={idx}
            className="bg-white p-3 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between text-xs"
          >
            <div>
              <span className="font-bold text-slate-900 line-clamp-1">{item.productName}</span>
              <div className="flex items-center gap-2 text-slate-500 text-[11px] mt-0.5">
                <span>Tam: <strong className="text-slate-800">{item.size}</strong></span>
                <span>Cor: <strong>{item.color}</strong></span>
                <span>Local: <strong>{item.shelfLocation}</strong></span>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  item.stock === 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                }`}>
                  Estoque: {item.stock} / Mín: {item.minStock}
                </span>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onEditProduct(item.productId)}
              className="shrink-0 border-amber-300 text-amber-900 hover:bg-amber-100 text-[11px] py-1 px-2"
            >
              Reestocar
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
