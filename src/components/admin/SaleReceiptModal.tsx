'use client';

import React from 'react';
import { Sale } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Printer, CheckCircle2, FileText, X } from 'lucide-react';
import { STORE_PHONE_FORMATTED, STORE_CEP, STORE_ADDRESS } from '../../lib/constants';

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
    const parts = dateStr.split('T')[0].split('-');
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
        return `CREDIÁRIO / PROMISSÓRIA (${sale.paymentDetails?.promissory?.installments || 1}x)`;
      default:
        return method.toUpperCase();
    }
  };

  const promissoryDetails = sale.paymentDetails?.promissory;
  const installmentsList = promissoryDetails?.installmentDetails || [];

  // BULLETPROOF THERMAL PRINTING (Dedicated pop-up print window for 80mm Elgin i9)
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=420,height=700');
    
    // Generate clean thermal HTML
    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Cupom Elgin i9 - ${sale.code}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0mm !important;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              line-height: 1.3;
              color: #000000;
              background: #ffffff;
              width: 76mm;
              margin: 0 auto;
              padding: 3mm 2mm 8mm 2mm;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .font-black { font-weight: 900; }
            .uppercase { text-transform: uppercase; }
            .flex { display: flex; }
            .justify-between { display: flex; justify-content: space-between; align-items: flex-start; }
            .border-b-dashed { border-bottom: 1px dashed #000000; }
            .border-t-dashed { border-top: 1px dashed #000000; }
            .border-t-solid { border-top: 2px solid #000000; }
            .py-1 { padding-top: 3px; padding-bottom: 3px; }
            .py-2 { padding-top: 6px; padding-bottom: 6px; }
            .pt-1 { padding-top: 3px; }
            .pt-2 { padding-top: 6px; }
            .pt-4 { padding-top: 14px; }
            .pt-6 { padding-top: 20px; }
            .pb-2 { padding-bottom: 6px; }
            .my-1 { margin-top: 4px; margin-bottom: 4px; }
            .item-row { margin-bottom: 5px; }
            .sub-text { font-size: 10px; color: #333333; }
            .legal-text { font-size: 9px; line-height: 1.25; text-align: justify; }
            .signature-line { border-bottom: 1px solid #000000; width: 80%; margin: 0 auto; }
          </style>
        </head>
        <body>
          <!-- 1. CABEÇALHO DA LOJA -->
          <div class="text-center pb-2 border-b-dashed">
            <div class="font-black uppercase" style="font-size: 13px;">PLANETA CALÇADOS QB LTDA</div>
            <div class="font-bold" style="font-size: 11px;">"O Planeta aos seus pés"</div>
            <div class="sub-text">CNPJ: 61.033.123/0001-45 • IE: 114.890.123.110</div>
            <div class="sub-text">${STORE_ADDRESS}</div>
            <div class="sub-text">Tel: ${STORE_PHONE_FORMATTED}</div>
            <div class="pt-1 font-bold uppercase" style="font-size: 10px;">DANFE NFC-e - Cupom Fiscal de Venda</div>
          </div>

          <!-- 2. DADOS DA VENDA -->
          <div class="py-2 border-b-dashed sub-text">
            <div class="justify-between font-bold">
              <span>DOC: ${sale.code}</span>
              <span>${formatDate(sale.createdAt)}</span>
            </div>
            <div class="justify-between">
              <span>CX: 01 - BALCÃO</span>
              <span>OP: VENDEDOR MATRIZ</span>
            </div>
          </div>

          <!-- 3. CONSUMIDOR -->
          <div class="py-2 border-b-dashed sub-text">
            <div class="font-bold uppercase">CONSUMIDOR:</div>
            <div class="justify-between">
              <span>NOME:</span>
              <strong class="font-bold">${sale.customer?.name || 'CONSUMIDOR FINAL'}</strong>
            </div>
            <div class="justify-between">
              <span>CPF/CNPJ:</span>
              <span>${sale.customer?.cpf || 'NÃO INFORMADO'}</span>
            </div>
            ${sale.customer?.phone ? `
              <div class="justify-between">
                <span>FONE:</span>
                <span>${sale.customer.phone}</span>
              </div>
            ` : ''}
          </div>

          <!-- 4. ITENS DISCRIMINADOS -->
          <div class="py-2 border-b-dashed">
            <div class="justify-between font-bold uppercase pb-1" style="font-size: 10px;">
              <span>ITEM / DESCRIÇÃO</span>
              <span class="text-right">TOTAL (R$)</span>
            </div>
            ${sale.items.map((item, idx) => `
              <div class="item-row">
                <div class="justify-between font-bold">
                  <span>${String(idx + 1).padStart(2, '0')}. ${item.productName}</span>
                  <span class="text-right">${formatBRL(item.total)}</span>
                </div>
                <div class="justify-between sub-text" style="padding-left: 6px;">
                  <span>SKU:${item.sku || 'N/A'} Tam:${item.selectedSize} Cor:${item.selectedColor}</span>
                  <span>${item.quantity} UN x ${formatBRL(item.unitPrice)}</span>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- 5. TOTAIS -->
          <div class="py-2 border-b-dashed" style="font-size: 11px;">
            <div class="justify-between">
              <span>Qtd. Itens:</span>
              <span class="font-bold">${totalQuantity} UN</span>
            </div>
            <div class="justify-between">
              <span>Subtotal:</span>
              <span>${formatBRL(sale.subtotal)}</span>
            </div>
            ${sale.discount > 0 ? `
              <div class="justify-between font-bold">
                <span>Desconto:</span>
                <span>- ${formatBRL(sale.discount)}</span>
              </div>
            ` : ''}
            <div class="justify-between font-black pt-1 border-t-dashed" style="font-size: 13px;">
              <span>TOTAL A PAGAR:</span>
              <span>${formatBRL(sale.total)}</span>
            </div>
          </div>

          <!-- 6. FORMA DE PAGAMENTO -->
          <div class="py-2 border-b-dashed sub-text">
            <div class="justify-between font-bold">
              <span>FORMA PGTO:</span>
              <span>${getPaymentMethodLabel(sale.paymentMethod)}</span>
            </div>
            ${sale.paymentMethod === 'money' && sale.paymentDetails?.cashReceived !== undefined ? `
              <div class="justify-between">
                <span>RECEBIDO:</span>
                <span>${formatBRL(sale.paymentDetails.cashReceived)}</span>
              </div>
              <div class="justify-between font-bold">
                <span>TROCO:</span>
                <span>${formatBRL(sale.paymentDetails.change || 0)}</span>
              </div>
            ` : ''}
          </div>

          <!-- 7. PROMISSÓRIA & PARCELAS -->
          ${sale.paymentMethod === 'promissory_note' ? `
            <div class="pt-2 border-t-solid">
              <div class="text-center font-black" style="font-size: 12px; margin-bottom: 4px;">*** NOTA PROMISSÓRIA ***</div>
              
              ${installmentsList.length > 0 ? `
                <div class="py-1 border-b-dashed border-t-dashed sub-text" style="margin-bottom: 6px;">
                  <div class="justify-between font-bold">
                    <span>PARCELA / DOC</span>
                    <span>VENCIMENTO</span>
                    <span class="text-right">VALOR</span>
                  </div>
                  ${installmentsList.map(inst => `
                    <div class="justify-between">
                      <span>${inst.installmentNumber}/${inst.totalInstallments} (Doc ${inst.documentNumber})</span>
                      <span>${formatDueDate(inst.dueDate)}</span>
                      <span class="font-bold text-right">${formatBRL(inst.amount)}</span>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <div class="sub-text" style="margin-bottom: 4px;">Vencimento Único: <strong>${formatDueDate(promissoryDetails?.dueDate)}</strong></div>
              `}

              <p class="legal-text pt-1">
                Pagarei por esta <strong>NOTA PROMISSÓRIA</strong> à empresa <strong>PLANETA CALÇADOS QB LTDA</strong>, CNPJ 61.033.123/0001-45, ou à sua ordem, na praça de Quatro Barras - PR, a quantia de <strong>${formatBRL(sale.total)}</strong> nas datas e parcelas acima discriminadas. Em caso de mora/atraso, incidirá multa de 2% (Art. 52 CDC) e juros legais de 1% ao mês pro rata die (Art. 406 CC).
              </p>

              <div class="sub-text pt-2">
                <div>EMITENTE: <strong>${sale.customer?.name || '__________________________'}</strong></div>
                <div>CPF/CNPJ: <strong>${sale.customer?.cpf || '__________________________'}</strong></div>
                <div>FONE: <strong>${sale.customer?.phone || '__________________________'}</strong></div>
              </div>

              <div class="pt-6 text-center">
                <div class="signature-line"></div>
                <div class="sub-text font-bold pt-1">Assinatura do Emitente / Devedor</div>
              </div>
            </div>
          ` : ''}

          <!-- 8. RODAPÉ -->
          <div class="pt-4 text-center sub-text">
            <div>Obrigado pela preferência! Volte sempre!</div>
            <div>Trocas com este cupom em até 30 dias.</div>
            <div style="font-size: 9px; padding-top: 4px; color: #666666;">--- FIM DO COMPROVANTE ---</div>
          </div>

          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          <\/script>
        </body>
      </html>
    `;

    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(receiptContent);
      printWindow.document.close();
    } else {
      window.print();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Comprovante Fiscal de Venda — ${sale.code}`}
      subtitle="Cupom de Venda Térmico Elgin i9 (80mm)"
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* RECEIPT PREVIEW WRAPPER */}
        <div
          id="printable-receipt-area"
          className="bg-white p-5 rounded-xl border border-slate-300 shadow-xs font-mono text-slate-900 text-xs leading-relaxed max-w-[360px] mx-auto overflow-y-auto max-h-[60vh]"
        >
          {/* ===================== 1. CABEÇALHO PADRÃO FISCAL ===================== */}
          <div className="text-center pb-2.5 border-b border-dashed border-slate-400 space-y-0.5">
            <h2 className="text-sm font-black tracking-wider text-slate-900 uppercase">
              PLANETA CALÇADOS QB LTDA
            </h2>
            <p className="text-[11px] font-bold text-slate-700">"O Planeta aos seus pés"</p>
            <p className="text-[10px] text-slate-600">
              CNPJ: 61.033.123/0001-45 • IE: 114.890.123.110
            </p>
            <p className="text-[10px] text-slate-600">
              {STORE_ADDRESS}
            </p>
            <p className="text-[10px] text-slate-600">
              Tel: {STORE_PHONE_FORMATTED}
            </p>

            <div className="pt-1.5 mt-1 border-t border-dotted border-slate-300">
              <span className="font-extrabold text-[10px] uppercase tracking-wide text-slate-900 block">
                DANFE NFC-e - Cupom de Venda
              </span>
              <span className="text-[9px] text-slate-500 block">
                Não permite aproveitamento de crédito de ICMS
              </span>
            </div>
          </div>

          {/* ===================== 2. DADOS DA VENDA ===================== */}
          <div className="py-2 border-b border-dashed border-slate-400 text-[11px] space-y-0.5">
            <div className="flex justify-between font-bold">
              <span>DOC: {sale.code}</span>
              <span>{formatDate(sale.createdAt)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>CX: 01 - BALCÃO</span>
              <span>OP: VENDEDOR MATRIZ</span>
            </div>
          </div>

          {/* ===================== 3. DADOS DO CONSUMIDOR ===================== */}
          <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5 bg-slate-50/80 p-1.5 rounded my-1">
            <div className="font-bold text-slate-900 text-[10px] uppercase">CONSUMIDOR:</div>
            <div className="flex justify-between">
              <span>NOME:</span>
              <strong className="font-bold text-slate-900 truncate max-w-[180px]">
                {sale.customer?.name || 'CONSUMIDOR FINAL'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>CPF/CNPJ:</span>
              <span>{sale.customer?.cpf || 'NÃO INFORMADO'}</span>
            </div>
            {sale.customer?.phone && (
              <div className="flex justify-between">
                <span>FONE:</span>
                <span>{sale.customer.phone}</span>
              </div>
            )}
          </div>

          {/* ===================== 4. TABELA DE ITENS ===================== */}
          <div className="py-2 border-b border-dashed border-slate-400">
            <div className="font-bold text-[10px] uppercase text-slate-900 mb-1 pb-1 border-b border-slate-200 flex justify-between">
              <span>ITEM / DESCRIÇÃO</span>
              <span>TOTAL (R$)</span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              {sale.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-900 truncate max-w-[200px]">
                      {String(idx + 1).padStart(2, '0')}. {item.productName}
                    </span>
                    <span className="font-bold text-slate-900 shrink-0 ml-1">
                      {formatBRL(item.total)}
                    </span>
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-600 pl-2">
                    <span>
                      SKU: {item.sku || 'N/A'} • T:{item.selectedSize} • {item.selectedColor}
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
          <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5 text-xs">
            <div className="flex justify-between text-slate-700 text-[11px]">
              <span>Qtd. Itens:</span>
              <span className="font-bold">{totalQuantity} UN</span>
            </div>
            <div className="flex justify-between text-slate-700 text-[11px]">
              <span>Subtotal:</span>
              <span>{formatBRL(sale.subtotal)}</span>
            </div>

            {sale.discount > 0 && (
              <div className="flex justify-between text-rose-700 font-bold text-[11px]">
                <span>Desconto:</span>
                <span>- {formatBRL(sale.discount)}</span>
              </div>
            )}

            <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-300">
              <span>TOTAL A PAGAR:</span>
              <span className="text-base font-extrabold text-slate-950">{formatBRL(sale.total)}</span>
            </div>
          </div>

          {/* ===================== 6. FORMA DE PAGAMENTO ===================== */}
          <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
            <div className="flex justify-between font-bold text-slate-900">
              <span>FORMA PGTO:</span>
              <span>{getPaymentMethodLabel(sale.paymentMethod)}</span>
            </div>

            {sale.paymentMethod === 'money' && sale.paymentDetails?.cashReceived !== undefined && (
              <div className="text-[10px] text-slate-600 space-y-0.5">
                <div className="flex justify-between">
                  <span>RECEBIDO:</span>
                  <span>{formatBRL(sale.paymentDetails.cashReceived)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800">
                  <span>TROCO:</span>
                  <span>{formatBRL(sale.paymentDetails.change || 0)}</span>
                </div>
              </div>
            )}
          </div>

          {/* ===================== 7. DISCRIMINAÇÃO DAS PARCELAS DA PROMISSÓRIA ===================== */}
          {sale.paymentMethod === 'promissory_note' && (
            <div className="mt-2.5 pt-2 border-t-2 border-slate-900 space-y-2">
              <div className="text-center font-black text-xs uppercase tracking-wider text-slate-900">
                *** NOTA PROMISSÓRIA ***
              </div>

              {/* Installments Table */}
              {installmentsList.length > 0 ? (
                <div className="space-y-1 py-1 border-y border-dashed border-slate-300 text-[10px]">
                  <div className="font-bold flex justify-between text-slate-900">
                    <span>PARCELA / DOC</span>
                    <span>VENCIMENTO</span>
                    <span className="text-right">VALOR</span>
                  </div>
                  {installmentsList.map(inst => (
                    <div key={inst.id} className="flex justify-between text-slate-700">
                      <span>{inst.installmentNumber}/{inst.totalInstallments} (Doc {inst.documentNumber})</span>
                      <span>{formatDueDate(inst.dueDate)}</span>
                      <span className="font-bold text-slate-900 text-right">{formatBRL(inst.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-slate-700">
                  Vencimento Único: <strong>{formatDueDate(promissoryDetails?.dueDate)}</strong>
                </div>
              )}

              {/* Legal Promissory Note Text */}
              <p className="text-[9px] leading-snug text-justify text-slate-800 pt-1">
                Pagarei por esta <strong>NOTA PROMISSÓRIA</strong> à empresa <strong>PLANETA CALÇADOS QB LTDA</strong>, CNPJ 61.033.123/0001-45, ou à sua ordem, na praça de Quatro Barras - PR, a quantia de <strong>{formatBRL(sale.total)}</strong> nas datas e parcelas acima discriminadas. Em caso de mora/atraso, incidirá multa de 2% (Art. 52 CDC) e juros legais de 1% ao mês pro rata die (Art. 406 CC).
              </p>
              
              <div className="text-[10px] space-y-0.5 pt-1">
                <div>EMITENTE: <strong>{sale.customer?.name || '__________________________'}</strong></div>
                <div>CPF/CNPJ: <strong>{sale.customer?.cpf || '__________________________'}</strong></div>
                <div>FONE: <strong>{sale.customer?.phone || '__________________________'}</strong></div>
              </div>

              {/* Signature Line */}
              <div className="pt-6 text-center space-y-0.5">
                <div className="border-b border-slate-800 w-4/5 mx-auto" />
                <p className="text-[9px] font-bold text-slate-900">Assinatura do Emitente / Devedor</p>
              </div>
            </div>
          )}

          {/* ===================== 8. RODAPÉ TÉRMICO COM CORTE LIMPO ===================== */}
          <div className="mt-3 pt-2 text-center text-[9px] text-slate-500 space-y-0.5 pb-4">
            <p>Obrigado pela preferência! Volte sempre!</p>
            <p>Trocas de calçados com este cupom em até 30 dias.</p>
            <p className="text-[8px] pt-1 text-slate-400">--- FIM DO DOCUMENTO ---</p>
          </div>
        </div>

        {/* ACTION BUTTONS (MODAL FOOTER) */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
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
            Imprimir Cupom Elgin i9 (80mm)
          </Button>
        </div>
      </div>
    </Modal>
  );
};
