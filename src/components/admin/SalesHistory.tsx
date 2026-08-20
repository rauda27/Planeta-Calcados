'use client';

import React, { useState } from 'react';
import { Sale } from '../../types';
import { useStore } from '../../context/StoreContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Tabs } from '../ui/Tabs';
import { EditSaleModal } from './EditSaleModal';
import { Printer, CheckCircle2, Clock, FileText, Search, Edit3, Trash2 } from 'lucide-react';

interface SalesHistoryProps {
  onReopenReceipt: (sale: Sale) => void;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({ onReopenReceipt }) => {
  const { sales, markPromissoryAsPaid, deleteSale } = useStore();
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'promissory'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const formatBRL = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleString('pt-BR');
  };

  const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return '30 dias';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const handleDeleteSale = (sale: Sale) => {
    const totalItems = sale.items.reduce((acc, i) => acc + i.quantity, 0);
    const confirmMsg = `Tem certeza que deseja EXCLUIR a venda ${sale.code} (Valor: ${formatBRL(sale.total)})?\n\nOs ${totalItems} produto(s) vendidos retornarão AUTOMATICAMENTE para o estoque do sistema.`;
    if (window.confirm(confirmMsg)) {
      deleteSale(sale.id);
    }
  };

  const promissorySales = sales.filter(
    s => s.paymentMethod === 'promissory_note' || s.status === 'promissory_pending'
  );
  const pendingPromissories = promissorySales.filter(s => !s.paymentDetails?.promissory?.isPaid);

  const filteredSales = sales.filter(sale => {
    if (activeSubTab === 'promissory') {
      if (sale.paymentMethod !== 'promissory_note' && sale.status !== 'promissory_pending') {
        return false;
      }
    }

    if (paymentFilter !== 'all' && sale.paymentMethod !== paymentFilter) {
      return false;
    }

    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const matchesCode = sale.code.toLowerCase().includes(q);
      const matchesCustomer = sale.customer?.name.toLowerCase().includes(q) || sale.customer?.cpf.includes(q);
      const matchesItem = sale.items.some(i => i.productName.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
      if (!matchesCode && !matchesCustomer && !matchesItem) return false;
    }

    return true;
  });

  const tabs = [
    { id: 'all', label: 'Histórico Completo de Vendas', icon: <FileText className="w-4 h-4" />, badge: sales.length },
    { id: 'promissory', label: 'Notas Promissórias / Contas a Receber', icon: <Clock className="w-4 h-4" />, badge: pendingPromissories.length, badgeVariant: pendingPromissories.length > 0 ? ('warning' as const) : ('default' as const) },
  ];

  return (
    <>
      <Card className="p-6 space-y-6">
        {/* Sub Tabs */}
        <Tabs tabs={tabs} activeTab={activeSubTab} onChange={(id) => setActiveSubTab(id as any)} />

        {/* Promissory Banner */}
        {activeSubTab === 'promissory' && (
          <div className="bg-gradient-to-r from-amber-500 to-amber-700 text-white p-5 rounded-2xl shadow-soft flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-200" />
                <h3 className="font-extrabold text-lg">Contas a Receber — Promissórias / Fiado</h3>
              </div>
              <p className="text-xs text-amber-100 mt-1">
                Acompanhamento de clientes com crediário próprio da loja e quitação de parcelas
              </p>
            </div>

            <div className="bg-amber-900/40 border border-amber-300/30 p-3 rounded-xl text-right">
              <span className="text-[11px] uppercase tracking-wider text-amber-200 block font-semibold">Total a Receber</span>
              <span className="text-2xl font-black text-white">
                {formatBRL(pendingPromissories.reduce((sum, s) => sum + s.total, 0))}
              </span>
            </div>
          </div>
        )}

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código, cliente, CPF ou produto..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-800 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Meio de Pagamento:</span>
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">Todos os meios</option>
              <option value="money">Dinheiro</option>
              <option value="pix">PIX</option>
              <option value="credit_card">Cartão de Crédito</option>
              <option value="debit_card">Cartão de Débito</option>
              <option value="promissory_note">Nota Promissória</option>
            </select>
          </div>
        </div>

        {/* Sales Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Código / Data</th>
                <th className="p-3.5">Cliente</th>
                <th className="p-3.5">Itens Vendidos</th>
                <th className="p-3.5">Pagamento</th>
                <th className="p-3.5">Valor Total</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400">
                    Nenhuma venda registrada com os parâmetros selecionados.
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => {
                  const isPromissory = sale.paymentMethod === 'promissory_note';
                  const isPaidPromissory = sale.paymentDetails?.promissory?.isPaid;

                  return (
                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                      {/* Code & Date */}
                      <td className="p-3.5">
                        <span className="font-mono font-extrabold text-slate-900 block text-xs">
                          {sale.code}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {formatDate(sale.createdAt)}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="p-3.5">
                        {sale.customer?.name ? (
                          <div>
                            <span className="font-bold text-slate-900 block truncate max-w-[160px]">
                              {sale.customer.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {sale.customer.cpf || sale.customer.phone}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Cliente Não Identificado</span>
                        )}
                      </td>

                      {/* Items Summary */}
                      <td className="p-3.5 max-w-xs">
                        <span className="font-bold text-slate-800 block line-clamp-1">
                          {sale.items.map(i => `${i.quantity}x ${i.productName} (${i.selectedSize})`).join(', ')}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Total de {sale.items.reduce((sum, i) => sum + i.quantity, 0)} unidade(s)
                        </span>
                      </td>

                      {/* Payment Method Badge */}
                      <td className="p-3.5">
                        <Badge
                          variant={
                            sale.paymentMethod === 'money'
                              ? 'success'
                              : sale.paymentMethod === 'pix'
                              ? 'emerald'
                              : sale.paymentMethod === 'promissory_note'
                              ? 'warning'
                              : 'default'
                          }
                          size="sm"
                        >
                          {sale.paymentMethod === 'money'
                            ? 'Dinheiro'
                            : sale.paymentMethod === 'pix'
                            ? 'PIX'
                            : sale.paymentMethod === 'credit_card'
                            ? `Crédito (${sale.paymentDetails?.creditInstallments || 1}x)`
                            : sale.paymentMethod === 'debit_card'
                            ? 'Débito'
                            : 'Promissória'}
                        </Badge>
                        {isPromissory && sale.paymentDetails?.promissory?.dueDate && (
                          <span className="block text-[10px] text-amber-800 font-bold mt-1">
                            Venc: {formatDueDate(sale.paymentDetails.promissory.dueDate)}
                          </span>
                        )}
                      </td>

                      {/* Total */}
                      <td className="p-3.5">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {formatBRL(sale.total)}
                        </span>
                        {sale.discount > 0 && (
                          <span className="block text-[10px] text-rose-600">Desc: -{formatBRL(sale.discount)}</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        {sale.status === 'completed' ? (
                          <Badge variant="success" size="sm" className="gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            CONCLUÍDA
                          </Badge>
                        ) : sale.status === 'promissory_pending' ? (
                          <Badge variant="warning" size="sm" className="gap-1 bg-amber-100 text-amber-900 border-amber-300">
                            <Clock className="w-3 h-3 text-amber-700" />
                            PROMISSÓRIA PENDENTE
                          </Badge>
                        ) : (
                          <Badge variant="danger" size="sm">
                            CANCELADA
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Settle Promissory Action */}
                          {isPromissory && !isPaidPromissory && sale.status === 'promissory_pending' && (
                            <Button
                              type="button"
                              size="sm"
                              variant="gold"
                              onClick={() => markPromissoryAsPaid(sale.id)}
                              className="py-1 px-2 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                              icon={<CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                            >
                              Dar Baixa
                            </Button>
                          )}

                          {/* Edit Sale Button */}
                          <button
                            type="button"
                            onClick={() => setEditingSale(sale)}
                            className="p-1.5 text-slate-600 hover:text-brand-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Editar / Corrigir Venda e Produtos"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Re-print Receipt Button */}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => onReopenReceipt(sale)}
                            className="py-1 px-2 text-[11px]"
                            icon={<Printer className="w-3.5 h-3.5 text-brand-primary" />}
                          >
                            Notinha
                          </Button>

                          {/* Delete Sale Button (Restores Stock Automatically) */}
                          <button
                            type="button"
                            onClick={() => handleDeleteSale(sale)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Excluir Venda (Estorna os produtos para o estoque)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Sale Modal */}
      <EditSaleModal
        sale={editingSale}
        isOpen={!!editingSale}
        onClose={() => setEditingSale(null)}
      />
    </>
  );
};
