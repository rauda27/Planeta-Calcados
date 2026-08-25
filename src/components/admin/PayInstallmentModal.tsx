'use client';

import React, { useState, useEffect } from 'react';
import { PromissoryContract, PromissoryInstallment } from '../../types';
import { useStore } from '../../context/StoreContext';
import { calculateOverdueDebt } from '../../lib/interestCalculator';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CheckCircle2, DollarSign, Calendar, AlertTriangle, ShieldCheck } from 'lucide-react';

interface PayInstallmentModalProps {
  contract: PromissoryContract | null;
  installment: PromissoryInstallment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PayInstallmentModal: React.FC<PayInstallmentModalProps> = ({
  contract,
  installment,
  isOpen,
  onClose,
}) => {
  const { payPromissoryInstallment } = useStore();

  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paidDate, setPaidDate] = useState<string>('');
  const [receivingLocation, setReceivingLocation] = useState<string>('Balcão Quatro Barras');

  const todayStr = new Date().toISOString().split('T')[0];

  // Dynamic legal interest and fine calculation
  const overdueCalc = installment
    ? calculateOverdueDebt(installment.amount, installment.dueDate, paidDate || todayStr)
    : null;

  useEffect(() => {
    if (installment) {
      const today = new Date().toISOString().split('T')[0];
      setPaidDate(today);
      const calc = calculateOverdueDebt(installment.amount, installment.dueDate, today);
      setPaidAmount(calc.totalCorrectedAmount);
      setReceivingLocation('Balcão Quatro Barras');
    }
  }, [installment, isOpen]);

  // Recalculate when paidDate changes
  const handleDateChange = (newDate: string) => {
    setPaidDate(newDate);
    if (installment) {
      const calc = calculateOverdueDebt(installment.amount, installment.dueDate, newDate);
      setPaidAmount(calc.totalCorrectedAmount);
    }
  };

  if (!contract || !installment || !overdueCalc) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (paidAmount <= 0) {
      alert('Informe um valor pago válido.');
      return;
    }

    payPromissoryInstallment(
      contract.id,
      installment.id,
      paidAmount,
      paidDate,
      receivingLocation
    );

    onClose();
  };

  const formatBRL = (val: number) => `R$ ${Number(val || 0).toFixed(2).replace('.', ',')}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Baixar Parcela ${installment.installmentNumber}/${installment.totalInstallments}`}
      subtitle={`Contrato: ${contract.contractNumber} • Cliente: ${contract.customerName}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info Header */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Documento:</span>
            <span className="font-mono font-bold text-slate-900">{installment.documentNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Vencimento Original:</span>
            <span className="font-semibold text-slate-800">
              {installment.dueDate.split('-').reverse().join('/')}
            </span>
          </div>
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <span>Valor Original da Parcela:</span>
            <span className="font-bold text-slate-900">{formatBRL(installment.amount)}</span>
          </div>
        </div>

        {/* Legal Calculation Box (when overdue) */}
        {overdueCalc.isOverdue && (
          <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-3 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-amber-950 font-bold text-[11px] uppercase pb-1 border-b border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              <span>Cálculo Legal de Encargos por Atraso ({overdueCalc.daysOverdue} dias)</span>
            </div>

            <div className="space-y-1 text-[11px] text-amber-900">
              <div className="flex justify-between">
                <span>Multa por Atraso (2,00% - Art. 52 CDC):</span>
                <span className="font-bold text-rose-700">+ {formatBRL(overdueCalc.fineAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Juros Moratórios (1,00% a.m. - Código Civil):</span>
                <span className="font-bold text-rose-700">+ {formatBRL(overdueCalc.interestAmount)}</span>
              </div>
              <div className="flex justify-between text-xs font-black text-amber-950 pt-1.5 border-t border-amber-200">
                <span>VALOR TOTAL ATUALIZADO:</span>
                <span className="text-sm font-extrabold text-amber-900">
                  {formatBRL(overdueCalc.totalCorrectedAmount)}
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPaidAmount(overdueCalc.totalCorrectedAmount)}
                className="flex-1 py-1 px-2 bg-amber-200/80 hover:bg-amber-200 text-amber-950 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
              >
                Cobrar c/ Juros ({formatBRL(overdueCalc.totalCorrectedAmount)})
              </button>
              <button
                type="button"
                onClick={() => setPaidAmount(overdueCalc.originalAmount)}
                className="flex-1 py-1 px-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
              >
                Isentar Juros ({formatBRL(overdueCalc.originalAmount)})
              </button>
            </div>
          </div>
        )}

        {/* Inputs */}
        <div className="space-y-3">
          <Input
            label="Valor a Receber (R$) *"
            type="number"
            step="0.01"
            required
            value={paidAmount}
            onChange={e => setPaidAmount(Number(e.target.value))}
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Data do Pagamento *
            </label>
            <Input
              type="date"
              required
              value={paidDate}
              onChange={e => handleDateChange(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Local de Recebimento
            </label>
            <Input
              type="text"
              value={receivingLocation}
              onChange={e => setReceivingLocation(e.target.value)}
              placeholder="Balcão Quatro Barras / PIX / Conta"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="primary"
            icon={<CheckCircle2 className="w-4 h-4 text-white" />}
          >
            Confirmar Recebimento ({formatBRL(paidAmount)})
          </Button>
        </div>
      </form>
    </Modal>
  );
};
