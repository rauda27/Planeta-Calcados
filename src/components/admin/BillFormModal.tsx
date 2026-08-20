'use client';

import React, { useState } from 'react';
import { Bill, BillCategory, BillStatus } from '../../types';
import { useStore } from '../../context/StoreContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Save } from 'lucide-react';

interface BillFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BillFormModal: React.FC<BillFormModalProps> = ({ isOpen, onClose }) => {
  const { addBill } = useStore();

  const [supplier, setSupplier] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BillCategory>('Estoque');
  const [amount, setAmount] = useState<number>(0);
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [barcode, setBarcode] = useState('');
  const [status, setStatus] = useState<BillStatus>('Pendente');
  const [pdfUrl, setPdfUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplier.trim() || amount <= 0 || !dueDate) {
      alert('Preencha o fornecedor, data de vencimento e um valor válido.');
      return;
    }

    addBill({
      supplier: supplier.trim(),
      description: description.trim(),
      category,
      amount,
      issueDate: issueDate || new Date().toISOString().split('T')[0],
      dueDate,
      barcode: barcode.trim(),
      status,
      pdfUrl: pdfUrl.trim() || undefined,
    });

    // Reset Form
    setSupplier('');
    setDescription('');
    setAmount(0);
    setIssueDate('');
    setDueDate('');
    setBarcode('');
    setPdfUrl('');

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
          placeholder="Ex: Fornecedor, Enel, Aluguel Loja..."
          required
        />

        <Input
          label="Descrição do Gasto / Nota Fiscal"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Ex: Fatura NFe - Lote de Calçados..."
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
            value={amount === 0 ? '' : amount}
            onChange={e => setAmount(Number(e.target.value))}
            placeholder="0.00"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Data de Emissão"
            type="date"
            value={issueDate}
            onChange={e => setIssueDate(e.target.value)}
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
          label="Código de Barras / Linha Digitável"
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
            placeholder="URL do PDF do boleto (opcional)..."
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
