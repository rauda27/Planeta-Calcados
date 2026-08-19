'use client';

import React, { useState } from 'react';
import { Bill, BillCategory, BillStatus } from '../../types';
import { useStore } from '../../context/StoreContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Save, FileText, Upload } from 'lucide-react';

interface BillFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BillFormModal: React.FC<BillFormModalProps> = ({ isOpen, onClose }) => {
  const { addBill } = useStore();

  const [supplier, setSupplier] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BillCategory>('Estoque');
  const [amount, setAmount] = useState<number>(1500);
  const [issueDate, setIssueDate] = useState('2026-08-01');
  const [dueDate, setDueDate] = useState('2026-08-10');
  const [barcode, setBarcode] = useState('34191.09008 01234.567894 12345.678903 1 98050000150000');
  const [status, setStatus] = useState<BillStatus>('Pendente');
  const [pdfUrl, setPdfUrl] = useState('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplier.trim() || amount <= 0) {
      alert('Preencha o fornecedor e um valor válido.');
      return;
    }

    addBill({
      supplier,
      description,
      category,
      amount,
      issueDate,
      dueDate,
      barcode,
      status,
      pdfUrl: pdfUrl || undefined,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cadastrar Novo Boleto / Conta a Pagar"
      subtitle="Preencha os dados do fornecedor, linha digitável e data de vencimento"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Fornecedor / Favorecido *"
          value={supplier}
          onChange={e => setSupplier(e.target.value)}
          placeholder="Ex: Vizzano Calçados Ltda, Enel, Aluguel Loja..."
          required
        />

        <Input
          label="Descrição do Gasto / Nota Fiscal"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Ex: Fatura NFe 8920 - Lote Scarpin Primavera"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria do Gasto</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as BillCategory)}
              className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white"
            >
              <option value="Estoque">Estoque (Mercadorias)</option>
              <option value="Aluguel">Aluguel do Imóvel</option>
              <option value="Impostos">Impostos (Simples/DAS)</option>
              <option value="Energia/Água">Energia / Água / Telecom</option>
              <option value="Marketing">Marketing / Anúncios</option>
              <option value="Salários">Salários & Pró-Labore</option>
              <option value="Outros">Outras Despesas</option>
            </select>
          </div>

          <Input
            label="Valor Total (R$) *"
            type="number"
            step="0.01"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Data de Emissão"
            type="date"
            value={issueDate}
            onChange={e => setIssueDate(e.target.value)}
            required
          />
          <Input
            label="Data de Vencimento *"
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            required
          />
        </div>

        <Input
          label="Código de Barras / Linha Digitável (47 Dígitos)"
          value={barcode}
          onChange={e => setBarcode(e.target.value)}
          placeholder="00000.00000 00000.000000 00000.000000 0 00000000000000"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status Inicial</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as BillStatus)}
              className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white font-bold"
            >
              <option value="Pendente">Pendente</option>
              <option value="Pago">Pago</option>
              <option value="Atrasado">Atrasado</option>
            </select>
          </div>

          <Input
            label="Link do PDF / Anexo do Boleto"
            value={pdfUrl}
            onChange={e => setPdfUrl(e.target.value)}
            placeholder="URL do PDF do boleto..."
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="gold" icon={<Save className="w-4 h-4 text-slate-950" />}>
            Salvar Boleto no Sistema
          </Button>
        </div>
      </form>
    </Modal>
  );
};
