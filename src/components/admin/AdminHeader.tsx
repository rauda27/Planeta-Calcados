'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  Package,
  CreditCard,
  ShoppingCart,
  Cloud,
  CloudOff,
  LogOut,
  Crown,
  UserCheck,
  Image as ImageIcon,
  Users,
  FileText,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Button } from '../ui/Button';
import { StoreLogo } from '../ui/StoreLogo';
import { getStoredAuthSession, logoutAdminSession, AuthRole } from './AdminAuthGuard';

export type AdminTab = 'inventory' | 'financial' | 'sales' | 'cadastros' | 'devedores';

interface AdminHeaderProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onOpenBannersModal?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ activeTab, onTabChange, onOpenBannersModal }) => {
  const { bills, isCloudConnected, customers, suppliers, promissoryContracts } = useStore();
  const [role, setRole] = useState<AuthRole>(null);

  useEffect(() => {
    const session = getStoredAuthSession();
    setRole(session.role);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayBills = bills.filter(b => b.dueDate === todayStr && b.status === 'Pendente');
  
  const pendingPromissoriesCount = promissoryContracts.filter(
    c => c.status === 'pending' || c.status === 'partial'
  ).length;

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      {/* 1. TOP BAR: LOGO, USER ROLES & SYSTEM ACTIONS */}
      <div className="border-b border-slate-800/80 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
          {/* Left: Brand & ERP Badge */}
          <div className="flex items-center gap-3">
            <StoreLogo variant="light" size="sm" />
            
            <span className="hidden sm:inline text-xs font-black bg-slate-800 px-2.5 py-1 rounded-lg text-brand-gold border border-slate-700">
              Painel ERP
            </span>

            {/* Role Badge */}
            {role === 'owner' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-950/90 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg" title="Acesso Total de Proprietário">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>Chefe</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-950/90 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-lg" title="Acesso Operacional de Colaborador">
                <UserCheck className="w-3 h-3 text-blue-400" />
                <span>Funcionário</span>
              </span>
            )}

            {/* Cloud Sync Status */}
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                isCloudConnected
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                  : 'bg-amber-950/70 border-amber-500/50 text-amber-300'
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
                  <span className="hidden md:inline">Nuvem Conectada</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3 h-3 text-amber-400" />
                  <span className="hidden md:inline">Local</span>
                </>
              )}
            </div>
          </div>

          {/* Right: Actions (Banners, Store & Logout) */}
          <div className="flex items-center gap-2">
            {/* Custom Banners Management Button */}
            {onOpenBannersModal && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenBannersModal}
                className="border-slate-700 bg-slate-800/80 text-brand-gold hover:bg-slate-800 hover:text-white shrink-0 text-xs px-3 py-1.5 h-8"
                title="Personalizar Banners e Imagens da Loja"
                icon={<ImageIcon className="w-3.5 h-3.5 text-brand-gold" />}
              >
                <span>Banners</span>
              </Button>
            )}

            {/* Back to Public Store Button */}
            <Link href="/">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-800 hover:text-white shrink-0 text-xs px-3 py-1.5 h-8"
                icon={<Store className="w-3.5 h-3.5 text-brand-gold" />}
              >
                <span>Loja</span>
              </Button>
            </Link>

            {/* Logout / Lock Session */}
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={logoutAdminSession}
              className="bg-rose-950/90 hover:bg-rose-900 border border-rose-800 text-rose-200 shrink-0 text-xs px-3 py-1.5 h-8"
              title="Encerrar Sessão e Bloquear Painel"
              icon={<LogOut className="w-3.5 h-3.5" />}
            >
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. DEDICATED FULL-WIDTH NAVIGATION TABS BAR (ALL 5 TABS VISIBLE) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {/* 1. Vendas & PDV */}
          <button
            type="button"
            onClick={() => onTabChange('sales')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'sales'
                ? 'bg-brand-primary text-white shadow-md ring-2 ring-brand-gold/60'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            <ShoppingCart className="w-4 h-4 text-brand-gold" />
            <span>Vendas & PDV</span>
          </button>

          {/* 2. Estoque */}
          <button
            type="button"
            onClick={() => onTabChange('inventory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-brand-primary text-white shadow-md ring-2 ring-brand-gold/60'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            <Package className="w-4 h-4 text-brand-gold" />
            <span>Estoque</span>
          </button>

          {/* 3. Cadastros (Clientes & Fornecedores) */}
          <button
            type="button"
            onClick={() => onTabChange('cadastros')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'cadastros'
                ? 'bg-brand-primary text-white shadow-md ring-2 ring-brand-gold/60'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            <Users className="w-4 h-4 text-brand-gold" />
            <span>Cadastros</span>
            {(customers.length > 0 || suppliers.length > 0) && (
              <span className="bg-slate-700 text-slate-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {customers.length + suppliers.length}
              </span>
            )}
          </button>

          {/* 4. Devedores & Promissórias */}
          <button
            type="button"
            onClick={() => onTabChange('devedores')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'devedores'
                ? 'bg-brand-primary text-white shadow-md ring-2 ring-brand-gold/60'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            <FileText className="w-4 h-4 text-brand-gold" />
            <span>Devedores / Crediário</span>
            {pendingPromissoriesCount > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] px-2 py-0.5 rounded-full font-black shadow-xs">
                {pendingPromissoriesCount}
              </span>
            )}
          </button>

          {/* 5. Boletos & Financeiro (SEMPRE VISÍVEL) */}
          <button
            type="button"
            onClick={() => onTabChange('financial')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'financial'
                ? 'bg-brand-primary text-white shadow-md ring-2 ring-brand-gold/60'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            <CreditCard className="w-4 h-4 text-brand-gold" />
            <span>Boletos & Financeiro</span>
            {todayBills.length > 0 ? (
              <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse shadow-xs">
                {todayBills.length} hoje
              </span>
            ) : (
              bills.length > 0 && (
                <span className="bg-slate-700 text-slate-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {bills.length}
                </span>
              )
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};
