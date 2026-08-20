'use client';

import React from 'react';
import { Sale } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Printer, Download, CheckCircle2 } from 'lucide-react';

interface SaleReceiptModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SaleReceiptModal: React.FC<SaleReceiptModalProps> = ({
  sale,
  isOpen,
  onClose,
}) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('pt-BR');
    } catch {
      return isoStr;
    }
  };

  const formatBRL = (val: number) => `R$ ${Number(val || 0).toFixed(2).replace('.', ',')}`;

  const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return '30 dias';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const totalQuantity = sale.items.reduce((acc, item) => acc + item.quantity, 0);

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'money':
        return 'DINHEIRO';
      case 'pix':
        return 'PIX INSTANTÂNEO';
      case 'credit_card':
        return `CARTÃO DE CRÉDITO (${sale.paymentDetails?.creditInstallments || 1}x)`;
      case 'debit_card':
        return 'CARTÃO DE DÉBITO';
      case 'promissory_note':
        return 'CREDIÁRIO / NOTA PROMISSÓRIA';
      default:
        return method.toUpperCase();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Comprovante Fiscal de Venda — ${sale.code}`}
      subtitle="DANFE NFC-e Padrão & Comprovante de Balcão"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* PRINT CSS STYLES: SNAPS DIRECTLY TO (0,0) ON PRINT WITHOUT CLIPPING */}
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
            #printable-receipt-area,
            #printable-receipt-area * {
              visibility: visible !important;
            }
            #printable-receipt-area {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 10px 15px !important;
              background: #ffffff !important;
              color: #000000 !important;
              box-shadow: none !important;
              border: none !important;
              z-index: 9999999 !important;
              font-family: 'Courier New', Courier, monospace !important;
              font-size: 11px !important;
              line-height: 1.35 !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        {/* RECEIPT WRAPPER */}
        <div
          id="printable-receipt-area"
          className="bg-white p-6 sm:p-8 rounded-xl border border-slate-300 shadow-sm font-mono text-slate-900 text-xs leading-relaxed max-w-full overflow-hidden"
        >
          {/* ===================== 1. CABEÇALHO PADRÃO FISCAL ===================== */}
          <div className="text-center pb-3 border-b border-dashed border-slate-400 space-y-1">
            <h2 className="text-base font-black tracking-wider text-slate-900 uppercase">
              PLANETA CALÇADOS QB LTDA
            </h2>
            <p className="text-[11px] font-bold text-slate-700">"O Planeta aos seus pés"</p>
            <p className="text-[10px] text-slate-600">
              CNPJ: 61.033.123/0001-45 • IE: 114.890.123.110
            </p>
            <p className="text-[10px] text-slate-600">
              Av. Dom Pedro II, 96 - Centro - Quatro Barras / PR - CEP: 83420-001
            </p>
            <p className="text-[10px] text-slate-600">
              Tel: (41) 99154-3389 • www.planetacalcados4b.com.br
            </p>

            <div className="pt-2 mt-2 border-t border-dotted border-slate-300">
              <span className="font-extrabold text-[11px] uppercase tracking-wide text-slate-900 block">
                DANFE NFC-e - Documento Auxiliar da Nota Fiscal de Consumidor
              </span>
              <span className="text-[9px] text-slate-500 block">
                Não permite aproveitamento de crédito de ICMS
              </span>
            </div>
          </div>

          {/* ===================== 2. DADOS DA VENDA ===================== */}
          <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-0.5">
            <div className="flex justify-between font-bold">
              <span>Nº DA VENDA: {sale.code}</span>
              <span>EMISSÃO: {formatDate(sale.createdAt)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>CAIXA: 01 - BALCÃO MATRIZ</span>
              <span>OPERADOR: VENDEDOR MATRIZ</span>
            </div>
          </div>

          {/* ===================== 3. DADOS DO CLIENTE / CONSUMIDOR ===================== */}
          <div className="py-2.5 border-b border-dashed border-slate-400 text-[10px] space-y-0.5 bg-slate-50/70 p-2 rounded my-1.5">
            <div className="font-bold text-slate-900 text-[11px]">DADOS DO CONSUMIDOR:</div>
            <div className="flex justify-between">
              <span>NOME / RAZÃO:</span>
              <strong className="font-semibold text-slate-900">
                {sale.customer?.name || 'CONSUMIDOR FINAL'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>CPF / CNPJ:</span>
              <span>{sale.customer?.cpf || 'NÃO INFORMADO'}</span>
            </div>
            {sale.customer?.phone && (
              <div className="flex justify-between">
                <span>TELEFONE:</span>
                <span>{sale.customer.phone}</span>
              </div>
            )}
          </div>

          {/* ===================== 4. TABELA DE ITENS (DISCRIMINADA) ===================== */}
          <div className="py-2.5 border-b border-dashed border-slate-400">
            <div className="font-bold text-[11px] uppercase text-slate-900 mb-1.5 pb-1 border-b border-slate-200 flex justify-between">
              <span>ITEM / DESCRIÇÃO / GRADE</span>
              <span>TOTAL (R$)</span>
            </div>

            <div className="space-y-2 text-[11px]">
              {sale.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-900">
                      {String(idx + 1).padStart(2, '0')}. {item.productName}
                    </span>
                    <span className="font-bold text-slate-900 shrink-0 ml-2">
                      {formatBRL(item.total)}
                    </span>
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-600 pl-4">
                    <span>
                      SKU: {item.sku || 'N/A'} • Tam: <strong>{item.selectedSize}</strong> • Cor: {item.selectedColor}
                    </span>
                    <span>
                      {item.quantity} UN x {formatBRL(item.unitPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ===================== 5. TOTALIZAÇÃO FINANCEIRA ===================== */}
          <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-xs">
            <div className="flex justify-between text-slate-700">
              <span>Qtd. Total de Itens:</span>
              <span className="font-bold">{totalQuantity} UN</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Subtotal dos Produtos:</span>
              <span>{formatBRL(sale.subtotal)}</span>
            </div>

            {sale.discount > 0 && (
              <div className="flex justify-between text-rose-700 font-bold">
                <span>Desconto Concedido:</span>
                <span>- {formatBRL(sale.discount)}</span>
              </div>
            )}

            <div className="flex justify-between font-black text-sm text-slate-900 pt-1.5 border-t border-slate-300">
              <span>VALOR TOTAL A PAGAR:</span>
              <span className="text-base font-extrabold text-brand-primary">{formatBRL(sale.total)}</span>
            </div>
          </div>

          {/* ===================== 6. FORMA DE PAGAMENTO ===================== */}
          <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
            <div className="font-bold text-slate-900 uppercase">FORMA DE PAGAMENTO:</div>
            
            <div className="flex justify-between font-bold text-slate-900">
              <span>{getPaymentMethodLabel(sale.paymentMethod)}</span>
              <span>{formatBRL(sale.total)}</span>
            </div>

            {sale.paymentMethod === 'money' && sale.paymentDetails?.cashReceived !== undefined && (
              <div className="text-[10px] text-slate-600 pt-0.5 space-y-0.5">
                <div className="flex justify-between">
                  <span>VALOR ENTREGUE:</span>
                  <span>{formatBRL(sale.paymentDetails.cashReceived)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800">
                  <span>TROCO:</span>
                  <span>{formatBRL(sale.paymentDetails.change || 0)}</span>
                </div>
              </div>
            )}

            {sale.paymentMethod === 'credit_card' && (
              <div className="text-[10px] text-slate-600">
                Parcelamento: {sale.paymentDetails?.creditInstallments || 1}x de {formatBRL(sale.total / (sale.paymentDetails?.creditInstallments || 1))}
              </div>
            )}

            {sale.paymentMethod === 'promissory_note' && (
              <div className="text-[10px] text-amber-800 font-bold bg-amber-50 p-1.5 rounded border border-amber-200 mt-1">
                Vencimento do Pagamento: {formatDueDate(sale.paymentDetails?.promissory?.dueDate)}
              </div>
            )}
          </div>

          {/* ===================== 7. TERMO LEGAL DA NOTA PROMISSÓRIA (QUANDO APLICÁVEL) ===================== */}
          {sale.paymentMethod === 'promissory_note' && (
            <div className="mt-3 pt-3 border-t-2 border-slate-900 space-y-2 bg-slate-50/90 p-3 rounded">
              <div className="text-center font-extrabold text-[11px] uppercase tracking-wider text-slate-900">
                *** NOTA PROMISSÓRIA ***
              </div>
              <p className="text-[10px] leading-relaxed text-justify text-slate-800">
                No dia <strong>{formatDueDate(sale.paymentDetails?.promissory?.dueDate)}</strong>, pagarei por esta <strong>ÚNICA NOTA PROMISSÓRIA</strong> à empresa <strong>PLANETA CALÇADOS LTDA</strong>, inscrita no CNPJ 61.033.123/0001-45, ou à sua ordem, a quantia de <strong>{formatBRL(sale.total)}</strong> em moeda corrente nacional, referente aos produtos descritos neste comprovante de venda.
              </p>
              
              <div className="text-[10px] space-y-0.5 pt-1">
                <div>EMITENTE / DEVEDOR: <strong>{sale.customer?.name || '__________________________'}</strong></div>
                <div>CPF / CNPJ: <strong>{sale.customer?.cpf || '__________________________'}</strong></div>
                <div>TELEFONE: <strong>{sale.customer?.phone || '__________________________'}</strong></div>
              </div>

              <div className="pt-6 text-center space-y-1">
                <div className="border-b border-slate-800 w-3/4 mx-auto" />
                <p className="text-[10px] font-bold text-slate-900">Assinatura do Emitente / Cliente</p>
              </div>
            </div>
          )}

          {/* ===================== 8. DADOS TRIBUTÁRIOS & RODAPÉ ===================== */}
          <div className="mt-3 pt-2 text-center text-[9px] text-slate-500 space-y-0.5">
            <p>Tributos Totais Incidentes (Lei Federal 12.741/2012): Aprox. 18,50%</p>
            <p className="font-bold text-slate-700">Obrigado pela preferência! Volte sempre!</p>
            <p>Trocas de calçados somente com este comprovante em até 30 dias.</p>
          </div>
        </div>

        {/* ACTION BUTTONS (MODAL FOOTER) */}
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
            className="shadow-gold px-6"
          >
            Imprimir Comprovante / DANFE
          </Button>
        </div>
      </div>
    </Modal>
  );
};
