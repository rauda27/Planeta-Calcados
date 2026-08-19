'use client';

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CashRegisterClosureModal } from './CashRegisterClosureModal';
import { DollarSign, TrendingUp, Calendar, CreditCard, PieChart, Award, ShoppingBag, Lock, ArrowUpRight, Sun, Calculator } from 'lucide-react';

export const RevenueDashboard: React.FC = () => {
  const { sales, products } = useStore();
  const [period, setPeriod] = useState<'today' | '7days' | 'month' | 'year' | 'all'>('all');
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);

  const todayStr = '2026-08-10';

  // Filter sales by period
  const filteredSales = sales.filter(s => {
    if (s.status === 'cancelled') return false;

    if (period === 'today') {
      return s.createdAt.startsWith(todayStr);
    }
    if (period === '7days') {
      const diffDays = (new Date(todayStr).getTime() - new Date(s.createdAt).getTime()) / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 7;
    }
    if (period === 'month') {
      return s.createdAt.startsWith('2026-08');
    }
    if (period === 'year') {
      return s.createdAt.startsWith('2026');
    }
    return true;
  });

  const formatBRL = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  // 1. GENERAL CALCULATIONS
  const grossRevenue = filteredSales.reduce((sum, s) => sum + s.subtotal, 0);
  const totalDiscounts = filteredSales.reduce((sum, s) => sum + s.discount, 0);
  const netRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const salesCount = filteredSales.length;
  const ticketMedio = salesCount > 0 ? netRevenue / salesCount : 0;

  // 2. TOTAL VENDAS DIÁRIA (HOJE)
  const todaySales = sales.filter(s => s.status !== 'cancelled' && s.createdAt.startsWith(todayStr));
  const todaySalesTotal = todaySales.reduce((sum, s) => sum + s.total, 0);
  const todaySalesCount = todaySales.length;
  const todayTicketMedio = todaySalesCount > 0 ? todaySalesTotal / todaySalesCount : 0;

  // 3. MÉDIA MENSAL DE VENDAS
  // Group sales by YYYY-MM
  const monthsMap: Record<string, number> = {};
  sales.filter(s => s.status !== 'cancelled').forEach(s => {
    const monthKey = s.createdAt.substring(0, 7); // e.g. "2026-08"
    monthsMap[monthKey] = (monthsMap[monthKey] || 0) + s.total;
  });
  const activeMonthsCount = Math.max(1, Object.keys(monthsMap).length);
  const totalAllTimeRevenue = sales.filter(s => s.status !== 'cancelled').reduce((sum, s) => sum + s.total, 0);
  const monthlyAverageRevenue = totalAllTimeRevenue / activeMonthsCount;

  // 4. MÉDIA DIÁRIA DE VENDAS
  const daysMap: Record<string, number> = {};
  sales.filter(s => s.status !== 'cancelled').forEach(s => {
    const dayKey = s.createdAt.substring(0, 10); // e.g. "2026-08-10"
    daysMap[dayKey] = (daysMap[dayKey] || 0) + s.total;
  });
  const activeDaysCount = Math.max(1, Object.keys(daysMap).length);
  const dailyAverageRevenue = totalAllTimeRevenue / activeDaysCount;

  // Estimated Gross Profit calculation (Sales Price - Cost Price of sold items)
  let totalCostPrice = 0;
  filteredSales.forEach(sale => {
    sale.items.forEach(item => {
      const matchedProduct = products.find(p => p.id === item.productId);
      const itemCost = matchedProduct ? matchedProduct.costPrice : item.unitPrice * 0.5;
      totalCostPrice += itemCost * item.quantity;
    });
  });
  const estimatedProfit = Math.max(0, netRevenue - totalCostPrice);
  const profitMargin = netRevenue > 0 ? (estimatedProfit / netRevenue) * 100 : 0;

  // Breakdown by Payment Method
  const paymentBreakdown = {
    money: filteredSales.filter(s => s.paymentMethod === 'money').reduce((sum, s) => sum + s.total, 0),
    pix: filteredSales.filter(s => s.paymentMethod === 'pix').reduce((sum, s) => sum + s.total, 0),
    credit_card: filteredSales.filter(s => s.paymentMethod === 'credit_card').reduce((sum, s) => sum + s.total, 0),
    debit_card: filteredSales.filter(s => s.paymentMethod === 'debit_card').reduce((sum, s) => sum + s.total, 0),
    promissory_note: filteredSales.filter(s => s.paymentMethod === 'promissory_note').reduce((sum, s) => sum + s.total, 0),
  };

  // Breakdown by Department
  const deptBreakdown: Record<string, number> = {};
  filteredSales.forEach(sale => {
    sale.items.forEach(item => {
      const matchedProduct = products.find(p => p.id === item.productId);
      const dept = matchedProduct?.department || 'Calçados';
      deptBreakdown[dept] = (deptBreakdown[dept] || 0) + item.total;
    });
  });

  // Top Products Ranking
  const productRankingMap: Record<string, { name: string; brand: string; qty: number; revenue: number }> = {};
  filteredSales.forEach(sale => {
    sale.items.forEach(item => {
      if (!productRankingMap[item.productName]) {
        productRankingMap[item.productName] = {
          name: item.productName,
          brand: item.brand,
          qty: 0,
          revenue: 0,
        };
      }
      productRankingMap[item.productName].qty += item.quantity;
      productRankingMap[item.productName].revenue += item.total;
    });
  });

  const topProducts = Object.values(productRankingMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header, Period Filters & Cash Register Closure Trigger */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-primary" />
            Relatório de Faturamento, Médias & Fechamento de Caixa
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            DRE consolidado, médias de vendas diárias e mensais, e emissão de Fechamento de Caixa
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Period Selector Buttons */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
            {[
              { id: 'today', label: 'Hoje' },
              { id: '7days', label: '7 Dias' },
              { id: 'month', label: 'Mês Atual' },
              { id: 'year', label: 'Ano 2026' },
              { id: 'all', label: 'Todo o Período' },
            ].map(btn => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setPeriod(btn.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  period === btn.id
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* CASH REGISTER CLOSURE TRIGGER BUTTON */}
          <Button
            type="button"
            variant="gold"
            onClick={() => setIsClosureModalOpen(true)}
            icon={<Lock className="w-4 h-4 text-slate-950" />}
            className="shadow-gold font-extrabold text-xs shrink-0"
          >
            Fechamento de Caixa Diário
          </Button>
        </div>
      </div>

      {/* HIGHLIGHTED ROW: VENDAS DIÁRIAS (HOJE) & MÉDIAS DE VENDAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Vendas Diária (Hoje) */}
        <div className="bg-gradient-to-br from-brand-primary to-slate-900 text-white p-5 rounded-2xl shadow-soft space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-gold flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-brand-gold" />
              Total Vendas Diárias (Hoje)
            </span>
            <span className="bg-brand-gold text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
              {todaySalesCount} vendas
            </span>
          </div>
          <div className="text-3xl font-black text-white pt-1">{formatBRL(todaySalesTotal)}</div>
          <p className="text-[11px] text-slate-300">
            Ticket médio hoje: <strong className="text-white">{formatBRL(todayTicketMedio)}</strong>
          </p>
        </div>

        {/* Média Mensal de Vendas */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-soft space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-300" />
              Média Mensal de Vendas
            </span>
            <span className="bg-indigo-500/30 text-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-400/30">
              {activeMonthsCount} mês(es) ativo(s)
            </span>
          </div>
          <div className="text-3xl font-black text-white pt-1">{formatBRL(monthlyAverageRevenue)}</div>
          <p className="text-[11px] text-indigo-200">
            Média de receita consolidada por mês operacional
          </p>
        </div>

        {/* Média Diária de Vendas */}
        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white p-5 rounded-2xl shadow-soft space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-emerald-300" />
              Média Diária de Vendas
            </span>
            <span className="bg-emerald-500/30 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-400/30">
              {activeDaysCount} dia(s) ativo(s)
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-400 pt-1">{formatBRL(dailyAverageRevenue)}</div>
          <p className="text-[11px] text-emerald-200">
            Faturamento médio por dia de loja aberta
          </p>
        </div>
      </div>

      {/* Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento Líquido */}
        <Card className="p-5 border-l-4 border-l-brand-primary">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Faturamento Líquido</span>
            <DollarSign className="w-5 h-5 text-brand-primary" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatBRL(netRevenue)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Bruto: {formatBRL(grossRevenue)} (Desc: -{formatBRL(totalDiscounts)})</p>
        </Card>

        {/* Card 2: Lucro Bruto Estimado */}
        <Card className="p-5 border-l-4 border-l-emerald-500 bg-emerald-50/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Lucro Estimado</span>
            <ArrowUpRight className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-950">{formatBRL(estimatedProfit)}</div>
          <p className="text-[11px] text-emerald-700 font-bold mt-1">Margem média: +{profitMargin.toFixed(1)}% sobre vendas</p>
        </Card>

        {/* Card 3: Ticket Médio */}
        <Card className="p-5 border-l-4 border-l-brand-gold">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ticket Médio</span>
            <ShoppingBag className="w-5 h-5 text-brand-gold" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatBRL(ticketMedio)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Baseado em {salesCount} venda(s) realizada(s)</p>
        </Card>

        {/* Card 4: Contas a Receber (Promissórias Abertas) */}
        <Card className="p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">A Receber (Promissórias)</span>
            <Calendar className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-950">{formatBRL(paymentBreakdown.promissory_note)}</div>
          <p className="text-[11px] text-amber-800 font-medium mt-1">Crediário próprio em aberto</p>
        </Card>
      </div>

      {/* Grid: Payment Method Breakdown & Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Faturamento por Meio de Pagamento */}
        <Card className="p-5 space-y-4">
          <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
            <PieChart className="w-4 h-4 text-brand-primary" />
            Faturamento por Meio de Pagamento
          </h4>

          <div className="space-y-3">
            {[
              { key: 'pix', label: 'PIX Instantâneo', val: paymentBreakdown.pix, color: 'bg-teal-500' },
              { key: 'credit_card', label: 'Cartão de Crédito', val: paymentBreakdown.credit_card, color: 'bg-indigo-500' },
              { key: 'money', label: 'Dinheiro Espécie', val: paymentBreakdown.money, color: 'bg-emerald-600' },
              { key: 'debit_card', label: 'Cartão de Débito', val: paymentBreakdown.debit_card, color: 'bg-blue-500' },
              { key: 'promissory_note', label: 'Nota Promissória', val: paymentBreakdown.promissory_note, color: 'bg-amber-500' },
            ].map(item => {
              const pct = netRevenue > 0 ? (item.val / netRevenue) * 100 : 0;
              return (
                <div key={item.key} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span>{item.label}</span>
                    <span>{formatBRL(item.val)} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Faturamento por Departamento & Top Produtos */}
        <Card className="p-5 space-y-4">
          <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
            <Award className="w-4 h-4 text-brand-gold" />
            Top Produtos & Departamentos Mais Vendidos
          </h4>

          {/* Dept Badges */}
          <div className="flex flex-wrap gap-2 pb-3 border-b border-slate-100">
            {Object.entries(deptBreakdown).map(([dept, total]) => (
              <div key={dept} className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500 font-semibold">{dept}: </span>
                <strong className="text-brand-primary">{formatBRL(total)}</strong>
              </div>
            ))}
          </div>

          {/* Top Products Table */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Ranking de Faturamento:</span>
            {topProducts.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhuma venda registrada no período.</p>
            ) : (
              topProducts.map((prod, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 line-clamp-1">{prod.name}</span>
                      <span className="text-[10px] text-slate-400">{prod.brand} • {prod.qty} un vendidas</span>
                    </div>
                  </div>
                  <span className="font-extrabold text-brand-primary">{formatBRL(prod.revenue)}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Cash Register Closure Modal */}
      <CashRegisterClosureModal
        isOpen={isClosureModalOpen}
        onClose={() => setIsClosureModalOpen(false)}
      />
    </div>
  );
};
