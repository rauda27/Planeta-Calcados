'use client';

import React, { useState } from 'react';
import { Sale } from '../../types';
import { POSFrontDesk } from './POSFrontDesk';
import { SalesHistory } from './SalesHistory';
import { RevenueDashboard } from './RevenueDashboard';
import { SaleReceiptModal } from './SaleReceiptModal';
import { ShoppingCart, History, TrendingUp } from 'lucide-react';
import { Tabs } from '../ui/Tabs';

export const POSModule: React.FC = () => {
  const [posSubTab, setPosSubTab] = useState<'pdv' | 'history' | 'revenue'>('pdv');
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const handleSaleSuccess = (sale: Sale) => {
    setActiveReceiptSale(sale);
    setIsReceiptModalOpen(true);
  };

  const handleReopenReceipt = (sale: Sale) => {
    setActiveReceiptSale(sale);
    setIsReceiptModalOpen(true);
  };

  const tabs = [
    { id: 'pdv', label: '1. Frente de Caixa (PDV)', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'history', label: '2. Histórico de Vendas & Promissórias', icon: <History className="w-4 h-4" /> },
    { id: 'revenue', label: '3. Relatório de Faturamento & DRE', icon: <TrendingUp className="w-4 h-4 text-brand-gold" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Top POS Header Sub-Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-soft">
        <Tabs tabs={tabs} activeTab={posSubTab} onChange={(id) => setPosSubTab(id as any)} />
      </div>

      {/* POS Register View */}
      {posSubTab === 'pdv' && (
        <div className="animate-in fade-in duration-200">
          <POSFrontDesk onSaleSuccess={handleSaleSuccess} />
        </div>
      )}

      {/* Sales History View */}
      {posSubTab === 'history' && (
        <div className="animate-in fade-in duration-200">
          <SalesHistory onReopenReceipt={handleReopenReceipt} />
        </div>
      )}

      {/* Revenue & Billing Dashboard View */}
      {posSubTab === 'revenue' && (
        <div className="animate-in fade-in duration-200">
          <RevenueDashboard />
        </div>
      )}

      {/* Printable Receipt Modal */}
      <SaleReceiptModal
        sale={activeReceiptSale}
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />
    </div>
  );
};
