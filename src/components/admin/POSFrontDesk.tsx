'use client';

import React, { useState } from 'react';
import { Product, ProductVariant, PaymentMethod, SaleItem, CustomerInfo } from '../../types';
import { useStore } from '../../context/StoreContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Search, ShoppingBag, Plus, Minus, Trash2, CreditCard, DollarSign, QrCode, FileText, CheckCircle2, ShieldAlert, UserCheck, ArrowRight, Percent } from 'lucide-react';

interface POSFrontDeskProps {
  onSaleSuccess: (completedSale: any) => void;
}

export const POSFrontDesk: React.FC<POSFrontDeskProps> = ({ onSaleSuccess }) => {
  const { products, addSale } = useStore();

  // Search & Product Selection State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [itemQuantity, setItemQuantity] = useState<number>(1);

  // Cart State
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Customer State
  const [customerName, setCustomerName] = useState('');
  const [customerCpf, setCustomerCpf] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('money');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [creditInstallments, setCreditInstallments] = useState<number>(1);
  const [promissoryDueDate, setPromissoryDueDate] = useState<string>('2026-09-10');

  // Filter products for search dropdown
  const filteredProducts = searchTerm.trim() === ''
    ? []
    : products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.mainEan.includes(searchTerm) ||
        p.variants.some(v => v.ean.includes(searchTerm))
      ).slice(0, 5);

  // Product selected from search
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    const firstColor = product.variants[0]?.color || '';
    setSelectedColor(firstColor);
    
    // Select first in-stock variant
    const inStock = product.variants.find(v => v.color === firstColor && v.stock > 0) || product.variants[0] || null;
    setSelectedVariant(inStock);
    setItemQuantity(1);
    setSearchTerm('');
  };

  const handleColorChange = (color: string) => {
    if (!selectedProduct) return;
    setSelectedColor(color);
    const matchingVariant = selectedProduct.variants.find(v => v.color === color && v.stock > 0) || selectedProduct.variants.find(v => v.color === color) || null;
    setSelectedVariant(matchingVariant);
  };

  // Add Item to POS Cart
  const handleAddItemToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedVariant) return;

    if (selectedVariant.stock <= 0) {
      alert('Variação sem estoque no momento.');
      return;
    }

    const unitPrice = selectedProduct.promoPrice || selectedProduct.salePrice;
    const itemTotal = unitPrice * itemQuantity;

    const newItem: SaleItem = {
      productId: selectedProduct.id,
      variantId: selectedVariant.id,
      productName: selectedProduct.name,
      brand: selectedProduct.brand,
      sku: selectedProduct.sku,
      selectedSize: selectedVariant.size,
      selectedColor: selectedColor,
      unitPrice,
      quantity: itemQuantity,
      total: itemTotal,
    };

    setCartItems(prev => {
      const existingIdx = prev.findIndex(
        i => i.productId === newItem.productId && i.variantId === newItem.variantId
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        const existing = updated[existingIdx];
        const newQty = existing.quantity + itemQuantity;
        updated[existingIdx] = {
          ...existing,
          quantity: newQty,
          total: existing.unitPrice * newQty,
        };
        return updated;
      }
      return [...prev, newItem];
    });

    // Reset selection box
    setSelectedProduct(null);
    setSelectedVariant(null);
    setItemQuantity(1);
  };

  const handleRemoveCartItem = (variantId: string) => {
    setCartItems(prev => prev.filter(i => i.variantId !== variantId));
  };

  const handleUpdateCartQty = (variantId: string, delta: number) => {
    setCartItems(prev =>
      prev.map(item => {
        if (item.variantId === variantId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty, total: item.unitPrice * newQty };
        }
        return item;
      })
    );
  };

  // Financial Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);

  const calculatedDiscount = discountType === 'percent'
    ? (subtotal * discountValue) / 100
    : Math.min(subtotal, discountValue);

  const totalAmount = Math.max(0, subtotal - calculatedDiscount);
  const changeAmount = paymentMethod === 'money' ? Math.max(0, cashReceived - totalAmount) : 0;

  // Open Payment Modal
  const handleOpenPayment = () => {
    if (cartItems.length === 0) {
      alert('Adicione pelo menos um item ao carrinho do PDV.');
      return;
    }
    setCashReceived(Math.ceil(totalAmount));
    setIsPaymentModalOpen(true);
  };

  // Finalize Sale
  const handleFinalizeSale = (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === 'promissory_note' && (!customerName.trim() || !customerCpf.trim())) {
      alert('Para Nota Promissória, o Nome e CPF/CNPJ do cliente são OBRIGATÓRIOS.');
      return;
    }

    const salePayload = {
      items: cartItems,
      subtotal,
      discount: calculatedDiscount,
      total: totalAmount,
      paymentMethod,
      paymentDetails: {
        cashReceived: paymentMethod === 'money' ? cashReceived : undefined,
        change: paymentMethod === 'money' ? changeAmount : undefined,
        creditInstallments: paymentMethod === 'credit_card' ? creditInstallments : undefined,
        promissory: paymentMethod === 'promissory_note' ? {
          customerName,
          customerCpf,
          customerPhone,
          dueDate: promissoryDueDate,
          installments: 1,
          isPaid: false,
        } : undefined,
      },
      customer: (customerName || customerCpf || customerPhone) ? {
        name: customerName,
        cpf: customerCpf,
        phone: customerPhone,
      } : undefined,
      status: paymentMethod === 'promissory_note' ? ('promissory_pending' as const) : ('completed' as const),
    };

    // Add sale to store and trigger stock deduction
    const createdSale = addSale(salePayload);

    // Reset POS form
    setCartItems([]);
    setDiscountValue(0);
    setCustomerName('');
    setCustomerCpf('');
    setCustomerPhone('');
    setIsPaymentModalOpen(false);

    // Trigger parent to open receipt modal
    onSaleSuccess(createdSale);
  };

  const formatBRL = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Product Search & Variant Picker (7 Cols) */}
      <div className="lg:col-span-7 space-y-6">
        <Card className="p-5 overflow-visible">
          <h3 className="font-extrabold text-slate-900 text-base mb-1 flex items-center gap-2">
            <Search className="w-4 h-4 text-brand-primary" />
            Localizar Produto (Nome, SKU ou EAN)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Digite o nome do produto ou escaneie o código de barras no leitor
          </p>

          <div className="relative z-30">
            <Input
              type="text"
              placeholder="Digite para buscar calçados, roupas, acessórios, perfumes..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="text-sm py-2.5 shadow-xs"
              autoFocus
            />

            {/* Dropdown Suggestions */}
            {filteredProducts.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className="p-3 hover:bg-emerald-50/60 transition-colors cursor-pointer flex items-center gap-3"
                  >
                    <img
                      src={product.images?.[0] || 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&auto=format&fit=crop&q=60'}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover bg-slate-100 border shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 text-xs truncate">{product.name}</div>
                      <div className="text-[11px] text-slate-500">{product.brand} • SKU: {product.sku}</div>
                    </div>
                    <span className="font-bold text-brand-primary text-xs shrink-0">
                      {formatBRL(product.promoPrice || product.salePrice)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Variant Picker Box */}
          {selectedProduct && (
            <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-brand-primary/20 space-y-4 animate-in fade-in">
              <div className="flex items-start gap-3">
                <img
                  src={selectedProduct.images?.[0] || 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&auto=format&fit=crop&q=60'}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover border border-slate-200 bg-white"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <Badge variant="emerald">{selectedProduct.brand}</Badge>
                    <button type="button" onClick={() => setSelectedProduct(null)} className="text-xs text-slate-400 hover:text-slate-600">✕ Cancelar</button>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{selectedProduct.name}</h4>
                  <span className="text-base font-extrabold text-brand-primary">
                    {formatBRL(selectedProduct.promoPrice || selectedProduct.salePrice)}
                  </span>
                </div>
              </div>

              {/* Color Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  1. Selecione a Cor:
                </label>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(selectedProduct.variants.map(v => v.color))).map(color => {
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleColorChange(color)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                          isSelected ? 'bg-brand-primary text-white border-brand-primary shadow-xs' : 'bg-white text-slate-800 border-slate-200'
                        }`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size Matrix Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  2. Selecione o Tamanho / Variação:
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.variants
                    .filter(v => v.color === selectedColor)
                    .map(variant => {
                      const isSelected = selectedVariant?.id === variant.id;
                      const isAvailable = variant.stock > 0;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => setSelectedVariant(variant)}
                          className={`px-3 py-2 rounded-xl border text-xs font-bold flex flex-col items-center cursor-pointer min-w-[50px] ${
                            !isAvailable
                              ? 'opacity-40 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                              : isSelected
                              ? 'bg-brand-primary text-white border-brand-primary shadow-sm ring-2 ring-brand-gold/40'
                              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span>{variant.size}</span>
                          <span className={`text-[9px] font-normal ${isSelected ? 'text-brand-gold' : 'text-slate-400'}`}>
                            {variant.stock} un
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Quantity & Add to Cart Button */}
              {selectedVariant && (
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Qtd:</span>
                    <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                      <button type="button" onClick={() => setItemQuantity(q => Math.max(1, q - 1))} className="px-2.5 py-1 text-slate-600 font-bold">-</button>
                      <span className="px-3 text-xs font-bold">{itemQuantity}</span>
                      <button type="button" onClick={() => setItemQuantity(q => Math.min(selectedVariant.stock, q + 1))} className="px-2.5 py-1 text-slate-600 font-bold">+</button>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="gold"
                    onClick={handleAddItemToCart}
                    disabled={selectedVariant.stock <= 0}
                    icon={<Plus className="w-4 h-4 text-slate-950" />}
                  >
                    Adicionar ao PDV
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Customer Identification Card */}
        <Card className="p-5">
          <h3 className="font-extrabold text-slate-900 text-sm mb-3 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-brand-primary" />
            Identificação do Cliente (Opcional / Obrigatório para Promissória)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Nome do Cliente"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Ex: Carlos Silva"
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
        </Card>
      </div>

      {/* Right Column: POS Cart & Checkout Summary (5 Cols) */}
      <div className="lg:col-span-5 space-y-6">
        <Card className="p-5 flex flex-col justify-between h-full min-h-[500px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-brand-primary" />
                Carrinho do PDV ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} itens)
              </h3>
              {cartItems.length > 0 && (
                <button type="button" onClick={() => setCartItems([])} className="text-xs text-rose-600 font-medium hover:underline">
                  Esvaziar
                </button>
              )}
            </div>

            {/* Cart Items List */}
            {cartItems.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">Nenhum item no carrinho do caixa.</p>
                <p className="text-[11px] text-slate-400">Busque um produto ao lado para iniciar a venda.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={item.variantId} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 truncate">{item.productName}</div>
                      <div className="text-[11px] text-slate-500">
                        Tam: <strong>{item.selectedSize}</strong> | Cor: <strong>{item.selectedColor}</strong>
                      </div>
                      <div className="font-semibold text-brand-primary mt-0.5">{formatBRL(item.unitPrice)} cada</div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center border border-slate-200 rounded bg-white">
                        <button type="button" onClick={() => handleUpdateCartQty(item.variantId, -1)} className="px-1.5 py-0.5 text-slate-600">-</button>
                        <span className="px-2 font-bold">{item.quantity}</span>
                        <button type="button" onClick={() => handleUpdateCartQty(item.variantId, 1)} className="px-1.5 py-0.5 text-slate-600">+</button>
                      </div>

                      <span className="font-bold text-slate-900 w-16 text-right">{formatBRL(item.total)}</span>

                      <button type="button" onClick={() => handleRemoveCartItem(item.variantId)} className="text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Discounts & Totals Box */}
          <div className="pt-4 border-t border-slate-100 space-y-3 mt-4">
            {/* Discount Inputs */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between font-semibold text-slate-700">
                <span>Aplicar Desconto:</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setDiscountType('fixed')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${discountType === 'fixed' ? 'bg-brand-primary text-white' : 'bg-slate-200 text-slate-700'}`}
                  >
                    R$ Real
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${discountType === 'percent' ? 'bg-brand-primary text-white' : 'bg-slate-200 text-slate-700'}`}
                  >
                    % Porcentagem
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountValue || ''}
                  onChange={e => setDiscountValue(Number(e.target.value))}
                  placeholder={discountType === 'fixed' ? '0,00' : '0%'}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Totals Summary */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal dos Itens:</span>
                <span>{formatBRL(subtotal)}</span>
              </div>

              {calculatedDiscount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Desconto Concedido:</span>
                  <span>- {formatBRL(calculatedDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-lg font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>TOTAL A PAGAR:</span>
                <span className="text-brand-primary">{formatBRL(totalAmount)}</span>
              </div>
            </div>

            {/* Checkout Trigger Button */}
            <Button
              type="button"
              variant="gold"
              size="lg"
              className="w-full shadow-gold py-3.5 text-base"
              disabled={cartItems.length === 0}
              onClick={handleOpenPayment}
              icon={<ArrowRight className="w-5 h-5 text-slate-950" />}
            >
              Ir para Pagamento • {formatBRL(totalAmount)}
            </Button>
          </div>
        </Card>
      </div>

      {/* PAYMENT SELECTION MODAL */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Forma de Pagamento — Frente de Caixa"
        subtitle={`Total da Venda: ${formatBRL(totalAmount)}`}
        maxWidth="xl"
      >
        <form onSubmit={handleFinalizeSale} className="space-y-6">
          {/* Payment Method Selector Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Selecione o Meio de Pagamento:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('money')}
                className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 cursor-pointer ${
                  paymentMethod === 'money' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300' : 'bg-white text-slate-800 border-slate-200'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <span>Dinheiro</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 cursor-pointer ${
                  paymentMethod === 'pix' ? 'bg-teal-600 text-white border-teal-600 shadow-md ring-2 ring-teal-300' : 'bg-white text-slate-800 border-slate-200'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span>PIX Instantâneo</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('credit_card')}
                className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 cursor-pointer ${
                  paymentMethod === 'credit_card' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300' : 'bg-white text-slate-800 border-slate-200'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Cartão Crédito</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('debit_card')}
                className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 cursor-pointer ${
                  paymentMethod === 'debit_card' ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300' : 'bg-white text-slate-800 border-slate-200'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Cartão Débito</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('promissory_note')}
                className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 cursor-pointer col-span-2 sm:col-span-1 ${
                  paymentMethod === 'promissory_note' ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-300' : 'bg-white text-slate-800 border-slate-200'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>Nota Promissória</span>
              </button>
            </div>
          </div>

          {/* Conditional Method Details */}
          {paymentMethod === 'money' && (
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-3">
              <Input
                label="Valor Recebido do Cliente (R$) *"
                type="number"
                step="0.01"
                value={cashReceived}
                onChange={e => setCashReceived(Number(e.target.value))}
                required
              />
              <div className="flex justify-between items-center text-sm font-bold text-emerald-950 pt-2 border-t border-emerald-200">
                <span>TROCO A DEVOLVER:</span>
                <span className="text-xl text-emerald-700 font-extrabold">{formatBRL(changeAmount)}</span>
              </div>
            </div>
          )}

          {paymentMethod === 'credit_card' && (
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 space-y-2">
              <label className="block text-xs font-bold text-indigo-950 mb-1">Número de Parcelas:</label>
              <select
                value={creditInstallments}
                onChange={e => setCreditInstallments(Number(e.target.value))}
                className="w-full border border-indigo-200 rounded-lg p-2.5 text-sm font-bold bg-white text-slate-900"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                  <option key={n} value={n}>
                    {n}x de {formatBRL(totalAmount / n)} {n === 1 ? '(À Vista)' : 'Sem Juros'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {paymentMethod === 'promissory_note' && (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-3">
              <div className="text-xs font-bold text-amber-900 uppercase">
                ⚠️ Regra da Nota Promissória (Fiado/Crediário)
              </div>
              <p className="text-xs text-amber-800">
                O comprovante gerado conterá a nota promissória legal pronta para colher a assinatura do cliente.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Input
                  label="Nome Completo do Cliente *"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Nome do pagador"
                  required
                />
                <Input
                  label="CPF / CNPJ do Cliente *"
                  value={customerCpf}
                  onChange={e => setCustomerCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Telefone do Cliente"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="(41) 99154-3389"
                />
                <Input
                  label="Data de Vencimento da Promissória *"
                  type="date"
                  value={promissoryDueDate}
                  onChange={e => setPromissoryDueDate(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
              Voltar ao Carrinho
            </Button>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="shadow-gold px-8 py-3"
              icon={<CheckCircle2 className="w-5 h-5 text-slate-950" />}
            >
              Finalizar Venda & Emitir Recibo
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
