'use client';

import React from 'react';
import Link from 'next/link';
import { Store, Package, CreditCard, ShoppingCart } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';
import { StoreLogo } from '../ui/StoreLogo';

interface AdminHeaderProps {
  activeTab: 'inventory' | 'financial' | 'sales';
  onTabChange: (tab: 'inventory' | 'financial' | 'sales') => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ activeTab, onTabChange }) => {
  const { products, bills, sales } = useStore();

  const todayStr = '2026-08-10';
  const todayBills = bills.filter(b => b.dueDate === todayStr && b.status === 'Pendente');
  const pendingPromissories = sales.filter(s => s.status === 'promissory_pending');
  const lowStockCount = products.reduce((count, p) => {
    const hasLowStockVariant = p.variants.some(v => v.stock <= v.minStock);
    return hasLowStockVariant ? count + 1 : count;
  }, 0);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & ERP Title */}
        <div className="flex items-center gap-3">
          <StoreLogo variant="light" size="sm" />
          <span className="hidden sm:inline text-xs font-bold bg-slate-800 px-2.5 py-1 rounded-lg text-brand-gold border border-slate-700">
            Painel ERP
          </span>
        </div>

        {/* Tab Switcher in Header */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 overflow-x-auto no-scrollbar max-w-full">
          <button
            type="button"
            onClick={() => onTabChange('sales')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'sales'
                ? 'bg-brand-primary text-white shadow-sm ring-1 ring-brand-gold/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 text-brand-gold" />
            <span>Vendas & PDV</span>
            {pendingPromissories.length > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold" title="Promissórias Pendentes">
                {pendingPromissories.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange('inventory')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-brand-primary text-white shadow-sm ring-1 ring-brand-gold/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-brand-gold" />
            <span>Gestão de Estoque</span>
            {lowStockCount > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                {lowStockCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange('financial')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'financial'
                ? 'bg-brand-primary text-white shadow-sm ring-1 ring-brand-gold/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-brand-gold" />
            <span>Financeiro & Boletos</span>
            {todayBills.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold animate-pulse">
                {todayBills.length}
              </span>
            )}
          </button>
        </div>

        {/* Back to Public Store Button */}
        <Link href="/">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white shrink-0"
            icon={<Store className="w-4 h-4 text-brand-gold" />}
          >
            Ir para a Loja
          </Button>
        </Link>
      </div>
    </header>
  );
};
