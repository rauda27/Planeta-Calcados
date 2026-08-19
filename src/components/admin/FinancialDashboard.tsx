'use client';

import React from 'react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../ui/Card';
import { AlertCircle, Calendar, DollarSign, CheckCircle2, AlertTriangle, Plus, FileText } from 'lucide-react';
import { Button } from '../ui/Button';

interface FinancialDashboardProps {
  activeFilter: 'hoje' | 'proximos' | 'vencidos' | 'pagos' | 'todos';
  onFilterChange: (filter: 'hoje' | 'proximos' | 'vencidos' | 'pagos' | 'todos') => void;
  onOpenBillModal: () => void;
}

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({
  activeFilter,
  onFilterChange,
  onOpenBillModal,
}) => {
  const { bills } = useStore();
  const todayStr = '2026-08-10'; // Current system date

  // Calculations
  const billsDueToday = bills.filter(b => b.dueDate === todayStr && b.status !== 'Pago');
  const totalToday = billsDueToday.reduce((sum, b) => sum + b.amount, 0);

  // Next 7 days
  const billsNext7Days = bills.filter(b => {
    if (b.status === 'Pago') return false;
    const diffDays = (new Date(b.dueDate).getTime() - new Date(todayStr).getTime()) / (1000 * 3600 * 24);
    return diffDays > 0 && diffDays <= 7;
  });
  const totalNext7Days = billsNext7Days.reduce((sum, b) => sum + b.amount, 0);

  // Total Month
  const totalMonth = bills.reduce((sum, b) => sum + b.amount, 0);

  // Overdue & Paid counts
  const overdueBills = bills.filter(b => b.status === 'Atrasado' || (b.status === 'Pendente' && b.dueDate < todayStr));
  const paidBills = bills.filter(b => b.status === 'Pago');
  const totalOverdue = overdueBills.reduce((sum, b) => sum + b.amount, 0);

  const formatBRL = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            Módulo Financeiro & Controle de Boletos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoramento em tempo real de contas a pagar, fornecedores e vencimentos diários
          </p>
        </div>

        <Button
          variant="gold"
          size="md"
          onClick={onOpenBillModal}
          icon={<Plus className="w-4 h-4 text-slate-950" />}
        >
          Novo Boleto / Conta a Pagar
        </Button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Boletos a Vencer Hoje (ALERT HIGHLIGHT) */}
        <div
          onClick={() => onFilterChange('hoje')}
          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-soft relative overflow-hidden ${
            billsDueToday.length > 0
              ? 'bg-gradient-to-br from-rose-500 to-rose-700 text-white border-rose-600 ring-4 ring-rose-200'
              : 'bg-white border-slate-100 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${billsDueToday.length > 0 ? 'text-rose-100' : 'text-slate-500'}`}>
              Vencem Hoje (10/08)
            </span>
            <AlertCircle className={`w-5 h-5 ${billsDueToday.length > 0 ? 'text-brand-gold animate-bounce' : 'text-slate-400'}`} />
          </div>

          <div className="text-2xl font-black tracking-tight">
            {formatBRL(totalToday)}
          </div>

          <p className={`text-xs mt-1 font-medium ${billsDueToday.length > 0 ? 'text-rose-100' : 'text-slate-400'}`}>
            {billsDueToday.length} boleto(s) pendentes para hoje
          </p>
        </div>

        {/* Card 2: Próximos 7 Dias */}
        <div
          onClick={() => onFilterChange('proximos')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white shadow-soft hover:border-brand-primary/40 ${
            activeFilter === 'proximos' ? 'ring-2 ring-brand-primary border-brand-primary' : 'border-slate-100'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Próximos 7 Dias
            </span>
            <Calendar className="w-5 h-5 text-amber-500" />
          </div>

          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {formatBRL(totalNext7Days)}
          </div>

          <p className="text-xs text-slate-500 mt-1 font-medium">
            {billsNext7Days.length} conta(s) a vencer na semana
          </p>
        </div>

        {/* Card 3: Total do Mês */}
        <div
          onClick={() => onFilterChange('todos')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white shadow-soft hover:border-brand-primary/40 ${
            activeFilter === 'todos' ? 'ring-2 ring-brand-primary border-brand-primary' : 'border-slate-100'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total a Pagar no Mês
            </span>
            <DollarSign className="w-5 h-5 text-brand-primary" />
          </div>

          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {formatBRL(totalMonth)}
          </div>

          <p className="text-xs text-slate-500 mt-1 font-medium">
            {bills.length} lançamentos registrados
          </p>
        </div>

        {/* Card 4: Boletos Vencidos / Pagos */}
        <div
          onClick={() => onFilterChange('vencidos')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white shadow-soft hover:border-brand-primary/40 ${
            activeFilter === 'vencidos' ? 'ring-2 ring-rose-500 border-rose-500' : 'border-slate-100'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Status Pagamentos
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {paidBills.length} <span className="text-xs text-slate-400 font-normal">pagos</span> / <span className="text-rose-600">{overdueBills.length}</span> <span className="text-xs text-rose-500 font-normal">atrasados</span>
          </div>

          <p className="text-xs text-rose-600 font-bold mt-1">
            {totalOverdue > 0 ? `Total Atrasado: ${formatBRL(totalOverdue)}` : 'Nenhum boleto em atraso'}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => onFilterChange('hoje')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            activeFilter === 'hoje'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>Vencem Hoje</span>
          {billsDueToday.length > 0 && (
            <span className="bg-white text-rose-700 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
              {billsDueToday.length}
            </span>
          )}
        </button>

        <button
          onClick={() => onFilterChange('proximos')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            activeFilter === 'proximos'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>Próximos (7 dias)</span>
          <span className="bg-emerald-800 text-white px-1.5 py-0.2 rounded-full text-[10px] font-semibold">
            {billsNext7Days.length}
          </span>
        </button>

        <button
          onClick={() => onFilterChange('vencidos')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            activeFilter === 'vencidos'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>Vencidos / Atrasados</span>
          {overdueBills.length > 0 && (
            <span className="bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
              {overdueBills.length}
            </span>
          )}
        </button>

        <button
          onClick={() => onFilterChange('pagos')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            activeFilter === 'pagos'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>Concluídos / Pagos ({paidBills.length})</span>
        </button>

        <button
          onClick={() => onFilterChange('todos')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeFilter === 'todos'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Todos os Boletos ({bills.length})
        </button>
      </div>
    </div>
  );
};
