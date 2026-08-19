'use client';

import React, { useState } from 'react';
import { Bill, BillStatus } from '../../types';
import { useStore } from '../../context/StoreContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Copy, Check, FileText, Download, Eye, Trash2, CheckCircle2, AlertTriangle, Clock, ExternalLink } from 'lucide-react';

interface BillsTableProps {
  activeFilter: 'hoje' | 'proximos' | 'vencidos' | 'pagos' | 'todos';
  onOpenBillModal: (bill?: Bill) => void;
}

export const BillsTable: React.FC<BillsTableProps> = ({ activeFilter, onOpenBillModal }) => {
  const { bills, updateBillStatus, deleteBill, showToast } = useStore();
  const todayStr = '2026-08-10';

  const [viewingAttachment, setViewingAttachment] = useState<{ title: string; url: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter bills based on tab selection
  const filteredBills = bills.filter(bill => {
    if (activeFilter === 'hoje') {
      return bill.dueDate === todayStr && bill.status !== 'Pago';
    }
    if (activeFilter === 'proximos') {
      if (bill.status === 'Pago') return false;
      const diffDays = (new Date(bill.dueDate).getTime() - new Date(todayStr).getTime()) / (1000 * 3600 * 24);
      return diffDays > 0 && diffDays <= 7;
    }
    if (activeFilter === 'vencidos') {
      return bill.status === 'Atrasado' || (bill.status === 'Pendente' && bill.dueDate < todayStr);
    }
    if (activeFilter === 'pagos') {
      return bill.status === 'Pago';
    }
    return true;
  });

  const handleCopyBarcode = (barcode: string, billId: string, supplier: string) => {
    navigator.clipboard.writeText(barcode);
    setCopiedId(billId);
    showToast(`Linha digitável de ${supplier} copiada para a área de transferência!`, 'success');
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleDelete = (id: string, description: string) => {
    if (window.confirm(`Excluir o boleto "${description}"?`)) {
      deleteBill(id);
    }
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <>
      <Card className="p-6">
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Fornecedor / Descrição</th>
                <th className="p-3.5">Categoria</th>
                <th className="p-3.5">Valor (R$)</th>
                <th className="p-3.5">Emissão</th>
                <th className="p-3.5">Vencimento</th>
                <th className="p-3.5">Linha Digitável / Código</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400">
                    Nenhum boleto encontrado nesta categoria.
                  </td>
                </tr>
              ) : (
                filteredBills.map(bill => {
                  const isDueToday = bill.dueDate === todayStr && bill.status !== 'Pago';
                  const isOverdue = (bill.status === 'Atrasado' || (bill.status === 'Pendente' && bill.dueDate < todayStr));

                  return (
                    <tr
                      key={bill.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isDueToday ? 'bg-rose-50/50' : ''
                      }`}
                    >
                      {/* Supplier & Description */}
                      <td className="p-3.5 max-w-xs">
                        <span className="font-bold text-slate-900 block truncate">
                          {bill.supplier}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                          {bill.description}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="p-3.5">
                        <Badge variant="default" size="sm" className="font-semibold bg-slate-100 text-slate-700">
                          {bill.category}
                        </Badge>
                      </td>

                      {/* Amount */}
                      <td className="p-3.5">
                        <span className="font-extrabold text-slate-900 text-sm">
                          R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Issue Date */}
                      <td className="p-3.5 text-slate-500 font-mono">
                        {formatDate(bill.issueDate)}
                      </td>

                      {/* Due Date */}
                      <td className="p-3.5 font-mono">
                        <span
                          className={`font-bold ${
                            isDueToday
                              ? 'text-rose-600 animate-pulse bg-rose-100 px-2 py-0.5 rounded'
                              : isOverdue
                              ? 'text-rose-700 font-black'
                              : bill.status === 'Pago'
                              ? 'text-slate-400 line-through'
                              : 'text-slate-800'
                          }`}
                        >
                          {formatDate(bill.dueDate)}
                        </span>
                      </td>

                      {/* Linha Digitável + 1-Click Copy */}
                      <td className="p-3.5 max-w-xs">
                        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                          <span className="font-mono text-[10px] text-slate-700 truncate flex-1" title={bill.barcode}>
                            {bill.barcode}
                          </span>
                          <button
                            onClick={() => handleCopyBarcode(bill.barcode, bill.id, bill.supplier)}
                            className={`p-1 rounded text-[11px] font-bold flex items-center gap-1 shrink-0 transition-all ${
                              copiedId === bill.id
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
                            }`}
                            title="Copiar Linha Digitável em 1-Clique"
                          >
                            {copiedId === bill.id ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-brand-primary" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="p-3.5">
                        {bill.status === 'Pago' ? (
                          <Badge variant="success" size="sm" className="gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            PAGO
                          </Badge>
                        ) : isDueToday ? (
                          <Badge variant="danger" size="sm" className="gap-1 animate-bounce bg-rose-600 text-white">
                            <Clock className="w-3 h-3 text-white" />
                            VENCE HOJE
                          </Badge>
                        ) : isOverdue ? (
                          <Badge variant="danger" size="sm" className="gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            ATRASADO
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm" className="gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            PENDENTE
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Payment */}
                          {bill.status !== 'Pago' ? (
                            <button
                              onClick={() => updateBillStatus(bill.id, 'Pago')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] transition-colors"
                              title="Marcar como PAGO"
                            >
                              Pagar
                            </button>
                          ) : (
                            <button
                              onClick={() => updateBillStatus(bill.id, 'Pendente')}
                              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded text-[11px] transition-colors"
                              title="Desfazer Pagamento"
                            >
                              Estornar
                            </button>
                          )}

                          {/* View Attachment */}
                          {bill.pdfUrl && (
                            <button
                              onClick={() => setViewingAttachment({ title: `Boleto: ${bill.supplier}`, url: bill.pdfUrl! })}
                              className="p-1.5 text-slate-600 hover:text-brand-primary hover:bg-slate-100 rounded"
                              title="Visualizar Documento PDF"
                            >
                              <FileText className="w-4 h-4 text-brand-primary" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(bill.id, bill.description)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Excluir Boleto"
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

      {/* Attachment Viewer Modal */}
      <Modal
        isOpen={!!viewingAttachment}
        onClose={() => setViewingAttachment(null)}
        title={viewingAttachment?.title || 'Visualizar Anexo'}
        maxWidth="3xl"
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-100 rounded-xl flex items-center justify-between text-xs text-slate-700">
            <span>Visualização de documento fictício anexado no lançamento.</span>
            <a
              href={viewingAttachment?.url}
              target="_blank"
              rel="noreferrer"
              className="text-brand-primary font-bold hover:underline flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir em Nova Aba
            </a>
          </div>

          <div className="w-full h-96 border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center">
            <iframe src={viewingAttachment?.url} className="w-full h-full" title="PDF Document" />
          </div>
        </div>
      </Modal>
    </>
  );
};
