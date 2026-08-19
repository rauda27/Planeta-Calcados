'use client';

import React, { useState } from 'react';
import { Sale } from '../../types';
import { useStore } from '../../context/StoreContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Printer, DollarSign, QrCode, CreditCard, FileText, Lock, Calendar, CheckCircle2, ShieldCheck } from 'lucide-react';

interface CashRegisterClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashRegisterClosureModal: React.FC<CashRegisterClosureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { sales } = useStore();
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-10');
  const [initialDrawerCash, setInitialDrawerCash] = useState<number>(200.00); // Fundo de caixa inicial

  const formatBRL = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

  const formatDateBR = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  // Filter sales for the selected closure date
  const dailySales = sales.filter(
    s => s.status !== 'cancelled' && s.createdAt.startsWith(selectedDate)
  );

  // Financial Breakdown for Closure
  const cashSales = dailySales.filter(s => s.paymentMethod === 'money').reduce((sum, s) => sum + s.total, 0);
  const pixSales = dailySales.filter(s => s.paymentMethod === 'pix').reduce((sum, s) => sum + s.total, 0);
  const creditSales = dailySales.filter(s => s.paymentMethod === 'credit_card').reduce((sum, s) => sum + s.total, 0);
  const debitSales = dailySales.filter(s => s.paymentMethod === 'debit_card').reduce((sum, s) => sum + s.total, 0);
  const promissorySales = dailySales.filter(s => s.paymentMethod === 'promissory_note').reduce((sum, s) => sum + s.total, 0);

  const totalDailyRevenue = dailySales.reduce((sum, s) => sum + s.total, 0);
  const totalDiscounts = dailySales.reduce((sum, s) => sum + s.discount, 0);
  const totalItemsSold = dailySales.reduce((sum, s) => sum + s.items.reduce((iSum, i) => iSum + i.quantity, 0), 0);

  // Total cash that should be in the drawer (Initial + Money Sales)
  const expectedDrawerCash = initialDrawerCash + cashSales;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Fechamento de Caixa Diário — ${formatDateBR(selectedDate)}`}
      subtitle="Relatório de conferência de valores, gaveta física e totais por forma de pagamento"
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Date & Drawer Initial Balance Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 no-print">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-brand-primary" />
              Data do Fechamento de Caixa:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Fundo de Caixa Inicial (Troco de Abertura R$):
            </label>
            <input
              type="number"
              step="0.01"
              value={initialDrawerCash}
              onChange={e => setInitialDrawerCash(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Printable Closure Slip Wrapper */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 font-mono text-slate-900 text-xs leading-relaxed printable-closure shadow-xs space-y-4">
          <style jsx global>{`
            @media print {
              @page {
                margin: 8mm;
                size: auto;
              }
              body {
                background: #fff !important;
                color: #000 !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              body * {
                visibility: hidden !important;
              }
              .printable-closure, .printable-closure * {
                visibility: visible !important;
              }
              .printable-closure {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                background: #fff !important;
                color: #000 !important;
                box-shadow: none !important;
                border: none !important;
                padding: 10px 15px !important;
                font-size: 11px !important;
                z-index: 9999999 !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          {/* Closure Slip Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <h2 className="text-base font-black text-slate-900 uppercase">PLANETA CALÇADOS QB</h2>
            <p className="text-[10px] text-slate-500">Av. Dom Pedro II, 96 - Centro, Quatro Barras - PR</p>
            <p className="text-[11px] font-bold text-slate-700 uppercase mt-1">RELATÓRIO DE FECHAMENTO DE CAIXA DIÁRIO</p>
            <p className="text-[10px] text-slate-500 mt-0.5">DATA: {formatDateBR(selectedDate)} | EMISSÃO: {new Date().toLocaleTimeString('pt-BR')}</p>
          </div>

          {/* General Summary */}
          <div className="py-2 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
            <div className="flex justify-between font-bold">
              <span>TOTAL DE VENDAS REALIZADAS:</span>
              <span>{dailySales.length} venda(s)</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>TOTAL DE UNIDADES VENDIDAS:</span>
              <span>{totalItemsSold} produto(s)</span>
            </div>
            {totalDiscounts > 0 && (
              <div className="flex justify-between text-rose-600 font-semibold">
                <span>TOTAL DE DESCONTOS CONCEDIDOS:</span>
                <span>- {formatBRL(totalDiscounts)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-sm text-brand-primary pt-1">
              <span>FATURAMENTO TOTAL DO DIA:</span>
              <span>{formatBRL(totalDailyRevenue)}</span>
            </div>
          </div>

          {/* Breakdown by Payment Method */}
          <div className="py-2 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
            <div className="font-extrabold text-slate-900 uppercase mb-1">DEMONSTRATIVO POR MEIO DE PAGAMENTO:</div>
            
            <div className="flex justify-between">
              <span>(+) DINHEIRO (ESPÉCIE):</span>
              <strong className="font-bold text-slate-900">{formatBRL(cashSales)}</strong>
            </div>

            <div className="flex justify-between">
              <span>(+) PIX INSTANTÂNEO:</span>
              <strong className="font-bold text-teal-700">{formatBRL(pixSales)}</strong>
            </div>

            <div className="flex justify-between">
              <span>(+) CARTÃO DE CRÉDITO:</span>
              <strong className="font-bold text-indigo-700">{formatBRL(creditSales)}</strong>
            </div>

            <div className="flex justify-between">
              <span>(+) CARTÃO DE DÉBITO:</span>
              <strong className="font-bold text-blue-700">{formatBRL(debitSales)}</strong>
            </div>

            <div className="flex justify-between">
              <span>(+) PROMISSÓRIAS (CREDIÁRIO GERADO):</span>
              <strong className="font-bold text-amber-800">{formatBRL(promissorySales)}</strong>
            </div>
          </div>

          {/* Drawer Reconciliation (Conferência de Gaveta Física) */}
          <div className="py-3 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
            <div className="font-extrabold text-slate-900 uppercase">CONFERÊNCIA DA GAVETA FÍSICA (DINHEIRO):</div>
            <div className="flex justify-between text-slate-600">
              <span>Fundo de Caixa Inicial (Troco):</span>
              <span>{formatBRL(initialDrawerCash)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>(+) Entradas em Dinheiro do Dia:</span>
              <span>{formatBRL(cashSales)}</span>
            </div>
            <div className="flex justify-between font-black text-slate-900 text-sm pt-1 border-t border-slate-300">
              <span>TOTAL ESPERADO NA GAVETA:</span>
              <span className="text-emerald-700">{formatBRL(expectedDrawerCash)}</span>
            </div>
          </div>

          {/* Signature Block */}
          <div className="pt-6 space-y-6 text-center text-[10px]">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="border-b border-slate-800 w-full mb-1" />
                <span className="font-bold text-slate-900">Operador de Caixa</span>
              </div>
              <div>
                <div className="border-b border-slate-800 w-full mb-1" />
                <span className="font-bold text-slate-900">Gerência / Visto</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between no-print pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Fechar
          </Button>

          <Button
            type="button"
            variant="gold"
            size="lg"
            onClick={handlePrint}
            icon={<Printer className="w-5 h-5 text-slate-950" />}
            className="shadow-gold"
          >
            Imprimir Fechamento de Caixa
          </Button>
        </div>
      </div>
    </Modal>
  );
};
