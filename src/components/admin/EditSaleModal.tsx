'use client';

import React, { useState, useEffect } from 'react';
import { Sale, PaymentMethod, SaleStatus, SaleItem, Product, ProductVariant } from '../../types';
import { useStore } from '../../context/StoreContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Save, UserCheck, DollarSign, Calendar, Edit3, Trash2, Plus, ShoppingBag, Search, PackageCheck } from 'lucide-react';

interface EditSaleModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditSaleModal: React.FC<EditSaleModalProps> = ({
  sale,
  isOpen,
  onClose,
}) => {
  const { products, updateSale } = useStore();

  const [customerName, setCustomerName] = useState('');
  const [customerCpf, setCustomerCpf] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('money');
  const [status, setStatus] = useState<SaleStatus>('completed');
  const [discount, setDiscount] = useState<number>(0);
  const [promissoryDueDate, setPromissoryDueDate] = useState<string>('2026-09-10');

  // Items editable list
  const [items, setItems] = useState<SaleItem[]>([]);

  // Add Product to Sale State
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<Product | null>(null);
  const [selectedColorToAdd, setSelectedColorToAdd] = useState<string>('');
  const [selectedVariantToAdd, setSelectedVariantToAdd] = useState<ProductVariant | null>(null);
  const [qtyToAdd, setQtyToAdd] = useState<number>(1);

  useEffect(() => {
    if (sale) {
      setCustomerName(sale.customer?.name || '');
      setCustomerCpf(sale.customer?.cpf || '');
      setCustomerPhone(sale.customer?.phone || '');
      setPaymentMethod(sale.paymentMethod);
      setStatus(sale.status);
      setDiscount(sale.discount || 0);
      setPromissoryDueDate(sale.paymentDetails?.promissory?.dueDate || '2026-09-10');
      setItems(sale.items ? JSON.parse(JSON.stringify(sale.items)) : []);
      setIsAddingProduct(false);
      setSelectedProductToAdd(null);
    }
  }, [sale, isOpen]);

  if (!sale) return null;

  const formatBRL = (val: number) => `R$ ${Number(val || 0).toFixed(2).replace('.', ',')}`;

  // Handle Item Quantity & Price Change
  const handleUpdateItemQty = (index: number, newQty: number) => {
    if (newQty < 1) return;
    setItems(prev =>
      prev.map((item, idx) => {
        if (idx === index) {
          return {
            ...item,
            quantity: newQty,
            total: item.unitPrice * newQty,
          };
        }
        return item;
      })
    );
  };

  const handleUpdateItemPrice = (index: number, newPrice: number) => {
    setItems(prev =>
      prev.map((item, idx) => {
        if (idx === index) {
          return {
            ...item,
            unitPrice: newPrice,
            total: newPrice * item.quantity,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert('A venda deve conter pelo menos 1 item. Para cancelar ou excluir toda a venda, use o botão Excluir Venda.');
      return;
    }
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Add new item into sale
  const handleSelectProduct = (product: Product) => {
    setSelectedProductToAdd(product);
    const firstColor = product.variants[0]?.color || '';
    setSelectedColorToAdd(firstColor);
    const inStock = product.variants.find(v => v.color === firstColor && v.stock > 0) || product.variants[0] || null;
    setSelectedVariantToAdd(inStock);
    setQtyToAdd(1);
    setSearchTerm('');
  };

  const handleColorChange = (color: string) => {
    if (!selectedProductToAdd) return;
    setSelectedColorToAdd(color);
    const matchingVariant = selectedProductToAdd.variants.find(v => v.color === color && v.stock > 0) || selectedProductToAdd.variants.find(v => v.color === color) || null;
    setSelectedVariantToAdd(matchingVariant);
  };

  const handleConfirmAddItem = () => {
    if (!selectedProductToAdd || !selectedVariantToAdd) return;

    const unitPrice = selectedProductToAdd.promoPrice || selectedProductToAdd.salePrice;
    const newItem: SaleItem = {
      productId: selectedProductToAdd.id,
      variantId: selectedVariantToAdd.id,
      productName: selectedProductToAdd.name,
      brand: selectedProductToAdd.brand,
      sku: selectedProductToAdd.sku,
      selectedSize: selectedVariantToAdd.size,
      selectedColor: selectedColorToAdd,
      unitPrice,
      quantity: qtyToAdd,
      total: unitPrice * qtyToAdd,
    };

    setItems(prev => {
      const existingIdx = prev.findIndex(
        i => i.productId === newItem.productId && i.variantId === newItem.variantId
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        const existing = updated[existingIdx];
        const newQty = existing.quantity + qtyToAdd;
        updated[existingIdx] = {
          ...existing,
          quantity: newQty,
          total: existing.unitPrice * newQty,
        };
        return updated;
      }
      return [...prev, newItem];
    });

    setIsAddingProduct(false);
    setSelectedProductToAdd(null);
  };

  const recalculatedSubtotal = items.reduce((sum, item) => sum + item.total, 0);
  const recalculatedTotal = Math.max(0, recalculatedSubtotal - discount);

  const filteredProducts = searchTerm.trim() === ''
    ? []
    : products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      alert('A venda precisa de pelo menos 1 produto.');
      return;
    }

    const updatedSale: Partial<Sale> = {
      customer: (customerName || customerCpf || customerPhone) ? {
        name: customerName,
        cpf: customerCpf,
        phone: customerPhone,
      } : undefined,
      paymentMethod,
      status,
      discount,
      subtotal: recalculatedSubtotal,
      total: recalculatedTotal,
      paymentDetails: {
        ...sale.paymentDetails,
        promissory: paymentMethod === 'promissory_note' ? {
          customerName: customerName || 'Cliente',
          customerCpf: customerCpf || '000.000.000-00',
          customerPhone: customerPhone || '',
          dueDate: promissoryDueDate,
          installments: 1,
          isPaid: status === 'completed',
          paidAt: status === 'completed' ? new Date().toISOString() : undefined,
        } : undefined,
      },
    };

    updateSale(sale.id, updatedSale, items);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar / Corrigir Venda — ${sale.code}`}
      subtitle="Corrija produtos, tamanhos, quantidades, cliente, pagamento e valores com estorno/baixa automática de estoque"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ================= 1. PRODUTOS & ITENS DA VENDA ================= */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-brand-primary" />
              Produtos da Venda ({items.reduce((sum, i) => sum + i.quantity, 0)} itens)
            </h4>
            
            {!isAddingProduct && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddingProduct(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Adicionar Outro Produto
              </Button>
            )}
          </div>

          {/* Add Product Search Dropdown inside Editor */}
          {isAddingProduct && (
            <div className="p-3 bg-white rounded-xl border border-brand-primary/30 space-y-3 animate-in fade-in">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-900">Buscar Produto para Incluir na Venda:</span>
                <button
                  type="button"
                  onClick={() => { setIsAddingProduct(false); setSelectedProductToAdd(null); }}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕ Fechar
                </button>
              </div>

              {!selectedProductToAdd ? (
                <div className="relative">
                  <Input
                    placeholder="Digite o nome do produto ou SKU..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                  {filteredProducts.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 divide-y divide-slate-100 max-h-56 overflow-y-auto">
                      {filteredProducts.map(p => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectProduct(p)}
                          className="p-2.5 hover:bg-slate-50 cursor-pointer flex justify-between items-center text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{p.name}</span>
                            <span className="text-[11px] text-slate-400 block">{p.brand} • SKU: {p.sku}</span>
                          </div>
                          <span className="font-bold text-brand-primary">
                            {formatBRL(p.promoPrice || p.salePrice)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-slate-900">{selectedProductToAdd.name} ({selectedProductToAdd.brand})</span>
                    <button type="button" onClick={() => setSelectedProductToAdd(null)} className="text-[11px] text-brand-primary underline">Trocar produto</button>
                  </div>

                  {/* Colors */}
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(new Set(selectedProductToAdd.variants.map(v => v.color))).map(col => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => handleColorChange(col)}
                        className={`px-2.5 py-1 text-xs rounded border font-semibold ${
                          selectedColorToAdd === col ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-slate-700'
                        }`}
                      >
                        {col}
                      </button>
                    ))}
                  </div>

                  {/* Sizes */}
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProductToAdd.variants
                      .filter(v => v.color === selectedColorToAdd)
                      .map(variant => (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => setSelectedVariantToAdd(variant)}
                          className={`px-3 py-1 text-xs rounded border font-bold ${
                            selectedVariantToAdd?.id === variant.id ? 'bg-brand-primary text-white border-brand-primary ring-1 ring-brand-gold' : 'bg-white text-slate-700'
                          }`}
                        >
                          {variant.size} ({variant.stock} un)
                        </button>
                      ))}
                  </div>

                  {/* Qty & Confirm */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-xs">
                      <span>Qtd:</span>
                      <input
                        type="number"
                        min="1"
                        value={qtyToAdd}
                        onChange={e => setQtyToAdd(Math.max(1, Number(e.target.value)))}
                        className="w-16 p-1 border rounded text-center font-bold"
                      />
                    </div>
                    <Button type="button" size="sm" variant="gold" onClick={handleConfirmAddItem}>
                      Incluir na Venda
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Table of Items */}
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 truncate">{item.productName}</div>
                  <div className="text-[11px] text-slate-500">
                    Tam: <strong className="text-slate-800">{item.selectedSize}</strong> | Cor: <strong className="text-slate-800">{item.selectedColor}</strong> | SKU: {item.sku}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  {/* Unit Price Edit */}
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-400">R$:</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitPrice}
                      onChange={e => handleUpdateItemPrice(idx, Number(e.target.value))}
                      className="w-20 p-1 border border-slate-200 rounded font-bold text-right"
                    />
                  </div>

                  {/* Quantity Edit */}
                  <div className="flex items-center border border-slate-200 rounded bg-slate-50">
                    <button
                      type="button"
                      onClick={() => handleUpdateItemQty(idx, item.quantity - 1)}
                      className="px-2 py-0.5 font-bold text-slate-600 hover:bg-slate-200"
                    >
                      -
                    </button>
                    <span className="px-2.5 font-bold text-slate-900">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateItemQty(idx, item.quantity + 1)}
                      className="px-2 py-0.5 font-bold text-slate-600 hover:bg-slate-200"
                    >
                      +
                    </button>
                  </div>

                  {/* Total of line */}
                  <span className="font-extrabold text-slate-900 w-20 text-right">
                    {formatBRL(item.total)}
                  </span>

                  {/* Delete Item */}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="Remover este item da venda"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= 2. DADOS DO CLIENTE ================= */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-brand-primary" />
            Dados do Cliente
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Nome do Cliente"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Nome"
            />
            <Input
              label="CPF / CNPJ"
              value={customerCpf}
              onChange={e => setCustomerCpf(e.target.value)}
              placeholder="000.000.000-00"
            />
            <Input
              label="Telefone / WhatsApp"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              placeholder="(41) 99154-3389"
            />
          </div>
        </div>

        {/* ================= 3. FORMA DE PAGAMENTO E STATUS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Forma de Pagamento</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-bold bg-white text-slate-900 cursor-pointer"
            >
              <option value="money">Dinheiro</option>
              <option value="pix">PIX Instantâneo</option>
              <option value="credit_card">Cartão de Crédito</option>
              <option value="debit_card">Cartão de Débito</option>
              <option value="promissory_note">Nota Promissória (Crediário)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status da Venda</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as SaleStatus)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-bold bg-white text-slate-900 cursor-pointer"
            >
              <option value="completed">Concluída / Paga</option>
              <option value="promissory_pending">Promissória Pendente</option>
              <option value="cancelled">Cancelada (Devolve Estoque)</option>
            </select>
          </div>
        </div>

        {paymentMethod === 'promissory_note' && (
          <Input
            label="Data de Vencimento da Promissória"
            type="date"
            value={promissoryDueDate}
            onChange={e => setPromissoryDueDate(e.target.value)}
          />
        )}

        {/* ================= 4. DESCONTO & TOTALIZADORES ================= */}
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-2">
          <Input
            label="Desconto Aplicado na Venda (R$)"
            type="number"
            step="0.01"
            min="0"
            value={discount}
            onChange={e => setDiscount(Number(e.target.value))}
          />
          <div className="flex justify-between items-center text-xs font-bold text-slate-800 pt-2 border-t border-emerald-200">
            <span>Subtotal dos Itens: {formatBRL(recalculatedSubtotal)}</span>
            <span className="text-base text-brand-primary font-black">
              Valor Total Atualizado: {formatBRL(recalculatedTotal)}
            </span>
          </div>
        </div>

        {/* ================= 5. AÇÕES ================= */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>

          <Button type="submit" variant="gold" size="lg" icon={<Save className="w-4 h-4 text-slate-950" />}>
            Salvar Correção & Atualizar Estoque
          </Button>
        </div>
      </form>
    </Modal>
  );
};
