'use client';

import React, { useState } from 'react';
import { PromissoryContract, PromissoryInstallment } from '../../types';
import { useStore } from '../../context/StoreContext';
import { calculateOverdueDebt } from '../../lib/interestCalculator';
import { PayInstallmentModal } from './PayInstallmentModal';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import {
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  DollarSign,
  User,
  Phone,
  Trash2,
  ArrowRight,
  Filter,
  Scale,
} from 'lucide-react';

export const DebtorsManagementModule: React.FC = () => {
  const {
    promissoryContracts,
    payEntirePromissoryContract,
    deletePromissoryContract,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all');

  // Modal State for Individual Installment Payment
  const [selectedContractForPayment, setSelectedContractForPayment] = useState<PromissoryContract | null>(null);
  const [selectedInstallmentForPayment, setSelectedInstallmentForPayment] = useState<PromissoryInstallment | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to format date
  const formatDateBR = (dateStr?: string) => {
    if (!dateStr) return '—';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formatBRL = (val?: number) =>
    val === undefined ? '—' : `R$ ${Number(val || 0).toFixed(2).replace('.', ',')}`;

  // Filter contracts
  const filteredContracts = promissoryContracts.filter(contract => {
    // 1. Search Query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchHeader =
        (contract.customerName && contract.customerName.toLowerCase().includes(q)) ||
        (contract.customerCpfCnpj && contract.customerCpfCnpj.includes(q)) ||
        (contract.contractNumber && contract.contractNumber.toLowerCase().includes(q)) ||
        (contract.saleCode && contract.saleCode.toLowerCase().includes(q));

      const matchDoc = contract.installments.some(
        inst => inst.documentNumber && inst.documentNumber.includes(q)
      );

      if (!matchHeader && !matchDoc) return false;
    }

    // 2. Status Filter
    if (statusFilter === 'pending') {
      return contract.status === 'pending' || contract.status === 'partial';
    }
    if (statusFilter === 'paid') {
      return contract.status === 'paid';
    }
    if (statusFilter === 'overdue') {
      return contract.installments.some(
        i => i.status !== 'paid' && i.dueDate < todayStr
      );
    }

    return true;
  });

  // Calculate Real General Totals (including legal interest calculation)
  const totalGeral = promissoryContracts.reduce((sum, c) => sum + c.totalSaleAmount, 0);
  
  const totalGeralCorrigido = promissoryContracts.reduce(
    (sum, c) =>
      sum +
      c.installments.reduce((instSum, i) => {
        if (i.status === 'paid') {
          return instSum + (i.paidAmount || i.amount);
        }
        const calc = calculateOverdueDebt(i.amount, i.dueDate);
        return instSum + calc.totalCorrectedAmount;
      }, 0),
    0
  );

  const totalPago = promissoryContracts.reduce((sum, c) => sum + (c.totalPaidAmount || 0), 0);
  const totalNaoPago = promissoryContracts.reduce((sum, c) => sum + (c.totalUnpaidAmount || 0), 0);

  const handleOpenPayInstallment = (contract: PromissoryContract, installment: PromissoryInstallment) => {
    setSelectedContractForPayment(contract);
    setSelectedInstallmentForPayment(installment);
    setIsPayModalOpen(true);
  };

  const handlePayEntireContract = (contract: PromissoryContract) => {
    if (
      confirm(
        `Deseja baixar e quitar integralmente todas as parcelas do contrato ${contract.contractNumber} (${contract.customerName})?`
      )
    ) {
      payEntirePromissoryContract(contract.id);
    }
  };

  const handleDeleteContract = (contract: PromissoryContract) => {
    if (
      confirm(
        `Tem certeza que deseja remover o contrato ${contract.contractNumber}? Esta ação não poderá ser desfeita.`
      )
    ) {
      deletePromissoryContract(contract.id);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Print Styles for Printable Debtors Report */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 10mm;
            size: A4 portrait;
          }
          body {
            background: #fff !important;
            color: #000 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-debtors-report,
          #printable-debtors-report * {
            visibility: visible !important;
          }
          #printable-debtors-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            font-size: 10px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs no-print">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-600" />
            <span>Gestão de Devedores — Contas a Receber & Promissórias</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Cálculo de juros e multas conforme Art. 52 do CDC (2% multa) e Art. 406 do Código Civil (1% a.m. pro rata die).
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrintReport}
            icon={<Printer className="w-4 h-4 text-slate-700" />}
          >
            Imprimir Relatório
          </Button>
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Buscar por cliente, CPF, contrato ou doc..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({promissoryContracts.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'pending' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Em Aberto
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('overdue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'overdue' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Atrasados
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'paid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Quitados
          </button>
        </div>
      </div>

      {/* Main Report Container */}
      <div id="printable-debtors-report" className="space-y-4">
        {filteredContracts.length === 0 ? (
          <Card className="text-center py-16 px-4">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">Nenhum contrato devedor encontrado</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Todos os contratos e parcelas cadastrados aparecerão aqui.
            </p>
          </Card>
        ) : (
          filteredContracts.map(contract => {
            const hasOverdue = contract.installments.some(
              i => i.status !== 'paid' && i.dueDate < todayStr
            );
            const isFullyPaid = contract.status === 'paid' || contract.totalUnpaidAmount <= 0;

            return (
              <div
                key={contract.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden font-sans text-xs text-slate-800"
              >
                {/* 1. Header Bar of the Contract (Mirroring PDF format) */}
                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <div className="font-bold text-blue-700 underline text-xs">
                      Contrato: {contract.contractNumber}
                    </div>
                    <div>
                      Nome: <strong className="text-slate-900 uppercase">{contract.customerName}</strong>
                    </div>
                    <div>
                      CPF/CNPJ: <span className="font-mono text-slate-700">{contract.customerCpfCnpj || 'Não informado'}</span>
                    </div>
                    {contract.customerPhone && (
                      <div>
                        Telefone: <span className="text-slate-600">{contract.customerPhone}</span>
                      </div>
                    )}
                    {contract.customerMobile && (
                      <div>
                        Celular: <span className="text-slate-600">{contract.customerMobile}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="font-bold text-slate-900 text-xs">
                      Valor Venda: <span className="text-brand-primary">{formatBRL(contract.totalSaleAmount)}</span>
                    </div>
                    <span className="font-mono text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {contract.saleCode}
                    </span>
                  </div>
                </div>

                {/* 2. Table of Installments (Mirroring Columns in PDF with Legal Interest Calculation) */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-white border-b border-slate-200 text-[10px] font-bold uppercase text-slate-600">
                      <tr>
                        <th className="py-2.5 px-4">Núm. Documento</th>
                        <th className="py-2.5 px-4">Emissão</th>
                        <th className="py-2.5 px-4">Vencimento</th>
                        <th className="py-2.5 px-4 text-right">Valor</th>
                        <th className="py-2.5 px-4 text-right">Vr. Corrigido</th>
                        <th className="py-2.5 px-4 text-center">Parcela</th>
                        <th className="py-2.5 px-4">Data Pagamento</th>
                        <th className="py-2.5 px-4 text-right">Vlr. Pago</th>
                        <th className="py-2.5 px-4">Local Recebimento</th>
                        <th className="py-2.5 px-4 text-center no-print">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {contract.installments.map(inst => {
                        const isOverdue = inst.status !== 'paid' && inst.dueDate < todayStr;
                        const isPaid = inst.status === 'paid';
                        const calc = calculateOverdueDebt(inst.amount, inst.dueDate);

                        return (
                          <tr
                            key={inst.id}
                            className={`hover:bg-slate-50/50 transition-colors ${
                              isPaid ? 'bg-emerald-50/30' : isOverdue ? 'bg-rose-50/40' : ''
                            }`}
                          >
                            <td className="py-2.5 px-4 font-mono font-medium text-slate-700">
                              {inst.documentNumber}
                            </td>

                            <td className="py-2.5 px-4 text-slate-600">
                              {formatDateBR(inst.issueDate)}
                            </td>

                            <td className="py-2.5 px-4 font-semibold">
                              <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                                {formatDateBR(inst.dueDate)}
                              </span>
                              {isOverdue && (
                                <span className="ml-1.5 text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold uppercase">
                                  {calc.daysOverdue}d atraso
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-4 text-right text-slate-700 font-medium">
                              {formatBRL(inst.amount)}
                            </td>

                            {/* Vr. Corrigido com juros legais */}
                            <td className="py-2.5 px-4 text-right font-bold">
                              {isPaid ? (
                                <span className="text-slate-500">{formatBRL(inst.paidAmount || inst.amount)}</span>
                              ) : isOverdue ? (
                                <span className="text-rose-700" title={`Original: ${formatBRL(inst.amount)} + Multa 2%: ${formatBRL(calc.fineAmount)} + Juros 1% a.m.: ${formatBRL(calc.interestAmount)}`}>
                                  {formatBRL(calc.totalCorrectedAmount)}
                                </span>
                              ) : (
                                <span className="text-slate-600">{formatBRL(inst.amount)}</span>
                              )}
                            </td>

                            <td className="py-2.5 px-4 text-center font-bold text-slate-900">
                              {inst.installmentNumber}/{inst.totalInstallments}
                            </td>

                            <td className="py-2.5 px-4 text-slate-700 font-medium">
                              {isPaid ? formatDateBR(inst.paidDate) : '—'}
                            </td>

                            <td className="py-2.5 px-4 text-right font-bold text-emerald-700">
                              {isPaid ? formatBRL(inst.paidAmount || inst.amount) : '—'}
                            </td>

                            <td className="py-2.5 px-4 text-slate-600 text-[10px]">
                              {isPaid ? inst.receivingLocation || 'Balcão Quatro Barras' : '—'}
                            </td>

                            <td className="py-2.5 px-4 text-center no-print">
                              {!isPaid ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPayInstallment(contract, inst)}
                                  className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-colors cursor-pointer"
                                >
                                  Baixar Parcela
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Pago
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 3. Footer Bar of the Contract (Mirroring PDF layout) */}
                <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4">
                    <div className="font-bold text-emerald-700">
                      Total pagos: {formatBRL(contract.totalPaidAmount)}
                    </div>
                    <div className="font-bold text-rose-600">
                      Total não pagos: {formatBRL(contract.totalUnpaidAmount)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 no-print">
                    {!isFullyPaid && (
                      <button
                        type="button"
                        onClick={() => handlePayEntireContract(contract)}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        Baixar Contrato
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteContract(contract)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Excluir Contrato"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* 4. Bottom General Summary Bar (Exact Mirror of PDF footer with dynamic correction) */}
        {promissoryContracts.length > 0 && (
          <div className="bg-white rounded-xl border-2 border-slate-300 p-4 shadow-sm mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center divide-x divide-slate-200">
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Geral
                </div>
                <div className="text-base sm:text-lg font-black text-slate-900 mt-1">
                  {formatBRL(totalGeral)}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center justify-center gap-1">
                  <Scale className="w-3 h-3 text-blue-600" />
                  <span>Total Geral Corrigido</span>
                </div>
                <div className="text-base sm:text-lg font-black text-blue-900 mt-1">
                  {formatBRL(totalGeralCorrigido)}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                  Total Pago
                </div>
                <div className="text-base sm:text-lg font-black text-emerald-700 mt-1">
                  {formatBRL(totalPago)}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
                  Total Não Pago
                </div>
                <div className="text-base sm:text-lg font-black text-rose-600 mt-1">
                  {formatBRL(totalNaoPago)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pay Installment Modal */}
      <PayInstallmentModal
        contract={selectedContractForPayment}
        installment={selectedInstallmentForPayment}
        isOpen={isPayModalOpen}
        onClose={() => {
          setIsPayModalOpen(false);
          setSelectedContractForPayment(null);
          setSelectedInstallmentForPayment(null);
        }}
      />
    </div>
  );
};
