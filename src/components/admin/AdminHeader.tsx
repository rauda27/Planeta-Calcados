'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Store, Package, CreditCard, ShoppingCart, Cloud, CloudOff, LogOut, Crown, UserCheck, Image as ImageIcon } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';
import { StoreLogo } from '../ui/StoreLogo';
import { getStoredAuthSession, logoutAdminSession, AuthRole } from './AdminAuthGuard';

interface AdminHeaderProps {
  activeTab: 'inventory' | 'financial' | 'sales';
  onTabChange: (tab: 'inventory' | 'financial' | 'sales') => void;
  onOpenBannersModal?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ activeTab, onTabChange, onOpenBannersModal }) => {
  const { products, bills, sales, isCloudConnected } = useStore();
  const [role, setRole] = useState<AuthRole>(null);

  useEffect(() => {
    const session = getStoredAuthSession();
    setRole(session.role);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayBills = bills.filter(b => b.dueDate === todayStr && b.status === 'Pendente');
  const pendingPromissories = sales.filter(s => s.status === 'promissory_pending');
  const lowStockCount = products.reduce((count, p) => {
    const hasLowStockVariant = p.variants.some(v => v.stock <= v.minStock);
    return hasLowStockVariant ? count + 1 : count;
  }, 0);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & ERP Title + Cloud Status Badge */}
        <div className="flex items-center gap-3">
          <StoreLogo variant="light" size="sm" />
          
          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline text-xs font-bold bg-slate-800 px-2.5 py-1 rounded-lg text-brand-gold border border-slate-700">
              Painel ERP
            </span>

            {/* Role Badge */}
            {role === 'owner' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg" title="Acesso Total de Proprietário">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>Chefe</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-950/80 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-lg" title="Acesso Operacional de Colaborador">
                <UserCheck className="w-3 h-3 text-blue-400" />
                <span>Funcionário</span>
              </span>
            )}
          </div>

          {/* Cloud Sync Status */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
              isCloudConnected
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
            }`}
            title={
              isCloudConnected
                ? 'Banco de dados na nuvem ativo (Firebase Firestore)'
                : 'Operando em modo local'
            }
          >
            {isCloudConnected ? (
              <>
                <Cloud className="w-3 h-3 text-emerald-400" />
                <span className="hidden lg:inline">Nuvem Conectada</span>
              </>
            ) : (
              <>
                <CloudOff className="w-3 h-3 text-amber-400" />
                <span className="hidden lg:inline">Local</span>
              </>
            )}
          </div>
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

        {/* Action Buttons: Banners, Store & Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Custom Banners Management Button */}
          {onOpenBannersModal && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenBannersModal}
              className="border-slate-700 text-brand-gold hover:bg-slate-800 hover:text-white shrink-0 text-xs px-2.5"
              title="Personalizar Banners e Imagens da Loja"
              icon={<ImageIcon className="w-3.5 h-3.5 text-brand-gold" />}
            >
              <span className="hidden sm:inline">Banners</span>
            </Button>
          )}

          {/* Back to Public Store Button */}
          <Link href="/">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white shrink-0 text-xs px-2.5"
              icon={<Store className="w-3.5 h-3.5 text-brand-gold" />}
            >
              <span className="hidden sm:inline">Loja</span>
            </Button>
          </Link>

          {/* Logout / Lock Session */}
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={logoutAdminSession}
            className="bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-200 shrink-0 text-xs px-2.5"
            title="Encerrar Sessão e Bloquear Painel"
            icon={<LogOut className="w-3.5 h-3.5" />}
          >
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
