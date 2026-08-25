'use client';

import React, { useState, useEffect } from 'react';
import {
  Product,
  ProductVariant,
  PaymentMethod,
  SaleItem,
  CustomerInfo,
  Customer,
  PromissoryInstallment,
} from '../../types';
import { useStore } from '../../context/StoreContext';
import { CustomerFormModal } from './CustomerFormModal';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import {
  Search,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  DollarSign,
  QrCode,
  FileText,
  CheckCircle2,
  ShieldAlert,
  UserCheck,
  ArrowRight,
  UserPlus,
  Calendar,
} from 'lucide-react';

interface POSFrontDeskProps {
  onSaleSuccess: (completedSale: any) => void;
}

export const POSFrontDesk: React.FC<POSFrontDeskProps> = ({ onSaleSuccess }) => {
  const { products, addSale, customers } = useStore();

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
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerCpf, setCustomerCpf] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('money');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [creditInstallments, setCreditInstallments] = useState<number>(1);

  // Promissory Installments State
  const [promissoryNumInstallments, setPromissoryNumInstallments] = useState<number>(1);
  const [promissoryInstallmentsList, setPromissoryInstallmentsList] = useState<PromissoryInstallment[]>([]);

  // Filter products for search dropdown
  const filteredProducts = searchTerm.trim() === ''
    ? []
    : products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.mainEan && p.mainEan.includes(searchTerm)) ||
        p.variants.some(v => 
          (v.ean && v.ean.includes(searchTerm)) ||
          `${p.sku}-${v.size}`.toLowerCase().includes(searchTerm.toLowerCase())
        )
      ).slice(0, 6);

  // Optical Barcode Scanner instant match on Enter
  const handleBarcodeSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const term = searchTerm.trim().toLowerCase();
      if (!term) return;

      // 1. Check exact variant barcode match (e.g. 26001-38 or EAN)
      for (const p of products) {
        for (const v of p.variants) {
          const variantBarcode = `${p.sku}-${v.size}`.toLowerCase();
          if (v.ean?.toLowerCase() === term || variantBarcode === term) {
            setSelectedProduct(p);
            setSelectedColor(v.color);
            setSelectedVariant(v);
            setItemQuantity(1);
            setSearchTerm('');
            return;
          }
        }
      }

      // 2. Check exact SKU match (e.g. 26001)
      const exactSkuProduct = products.find(p => p.sku.toLowerCase() === term);
      if (exactSkuProduct) {
        handleSelectProduct(exactSkuProduct);
        return;
      }

      // 3. Fallback to first filtered match
      if (filteredProducts.length > 0) {
        handleSelectProduct(filteredProducts[0]);
      }
    }
  };

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
      prev
        .map(item => {
          if (item.variantId === variantId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              total: item.unitPrice * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as SaleItem[]
    );
  };

  // Financial calculations
  const subtotal = cartItems.reduce((sum, i) => sum + i.total, 0);
  
  let calculatedDiscount = 0;
  if (discountType === 'fixed') {
    calculatedDiscount = Math.min(subtotal, Math.max(0, discountValue));
  } else {
    calculatedDiscount = Math.min(subtotal, (subtotal * Math.max(0, discountValue)) / 100);
  }

  const totalAmount = Math.max(0, subtotal - calculatedDiscount);
  const changeAmount = paymentMethod === 'money' && cashReceived > totalAmount ? cashReceived - totalAmount : 0;

  // Auto-generate installments when totalAmount or promissoryNumInstallments change
  useEffect(() => {
    if (totalAmount <= 0) {
      setPromissoryInstallmentsList([]);
      return;
    }

    const n = Math.max(1, promissoryNumInstallments);
    const baseInstallmentValue = Number((totalAmount / n).toFixed(2));
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const generated: PromissoryInstallment[] = [];
    for (let i = 1; i <= n; i++) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30 * i);
      const docNumber = `50${Math.floor(100000 + Math.random() * 900000)}`;

      // Adjust last installment cents rounding
      const val = i === n
        ? Number((totalAmount - baseInstallmentValue * (n - 1)).toFixed(2))
        : baseInstallmentValue;

      generated.push({
        id: `inst_${Date.now()}_${i}`,
        documentNumber: docNumber,
        installmentNumber: i,
        totalInstallments: n,
        issueDate: todayStr,
        dueDate: dueDate.toISOString().split('T')[0],
        amount: val,
        status: 'pending',
      });
    }

    setPromissoryInstallmentsList(generated);
  }, [totalAmount, promissoryNumInstallments]);

  // Handle Customer Selection from Dropdown
  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (!customerId) {
      setCustomerName('');
      setCustomerCpf('');
      setCustomerPhone('');
      return;
    }

    const found = customers.find(c => c.id === customerId);
    if (found) {
      setCustomerName(found.name);
      setCustomerCpf(found.cpfCnpj);
      setCustomerPhone(found.mobile || found.phone || '');
    }
  };

  const handleOpenPayment = () => {
    if (cartItems.length === 0) {
      alert('Adicione pelo menos um item ao carrinho.');
      return;
    }
    setCashReceived(totalAmount);
    setIsPaymentModalOpen(true);
  };

  // Finalize Sale
  const handleFinalizeSale = (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === 'money' && cashReceived < totalAmount) {
      alert('O valor em dinheiro recebido não pode ser menor que o total da venda.');
      return;
    }

    if (paymentMethod === 'promissory_note') {
      if (!customerName.trim() || !customerCpf.trim()) {
        alert('Para vendas no Crediário / Nota Promissória, é obrigatório preencher o Nome e CPF do cliente.');
        return;
      }
    }

    let customerInfo: CustomerInfo | undefined = undefined;
    if (customerName.trim()) {
      customerInfo = {
        id: selectedCustomerId || undefined,
        name: customerName.trim(),
        cpf: customerCpf.trim() || 'NÃO INFORMADO',
        phone: customerPhone.trim() || '',
      };
    }

    const completedSale = addSale({
      items: cartItems,
      subtotal,
      discount: calculatedDiscount,
      total: totalAmount,
      paymentMethod,
      paymentDetails: {
        cashReceived: paymentMethod === 'money' ? cashReceived : undefined,
        change: paymentMethod === 'money' ? changeAmount : undefined,
        creditInstallments: paymentMethod === 'credit_card' ? creditInstallments : undefined,
        promissory:
          paymentMethod === 'promissory_note'
            ? {
                customerName: customerName.trim(),
                customerCpf: customerCpf.trim(),
                customerPhone: customerPhone.trim(),
                dueDate: promissoryInstallmentsList[0]?.dueDate || '30 dias',
                installments: promissoryNumInstallments,
                installmentDetails: promissoryInstallmentsList,
                isPaid: false,
              }
            : undefined,
      },
      customer: customerInfo,
      status: paymentMethod === 'promissory_note' ? 'promissory_pending' : 'completed',
    });

    // Reset local state
    setCartItems([]);
    setDiscountValue(0);
    setSelectedCustomerId('');
    setCustomerName('');
    setCustomerCpf('');
    setCustomerPhone('');
    setIsPaymentModalOpen(false);

    // Call parent handler to show receipt modal
    onSaleSuccess(completedSale);
  };

  const formatBRL = (val: number) => `R$ ${Number(val || 0).toFixed(2).replace('.', ',')}`;

  const selectedCustomerObj = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Product Search, Catalog Selector & Customer Details (7 Cols) */}
      <div className="lg:col-span-7 space-y-6">
        {/* Product Quick Search Bar */}
        <Card className="p-5 border-brand-primary/20">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
            Pesquisar Calçado / Produto (Nome, SKU ou Código de Barras):
          </label>
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Digite o modelo, SKU (ex: 26001) ou bipe o leitor de código de barras..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={handleBarcodeSearchKeyDown}
              className="pl-11 h-12 text-sm font-medium"
              autoFocus
            />
          </div>

          {/* Search Autocomplete Results Dropdown */}
          {filteredProducts.length > 0 && (
            <div className="mt-2 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden divide-y divide-slate-100 z-30 relative animate-in fade-in-50">
              {filteredProducts.map(product => {
                const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
                const displayPrice = product.promoPrice || product.salePrice;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelectProduct(product)}
                    className="w-full p-3 text-left hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded-lg bg-slate-100 border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-xs truncate">{product.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {product.brand} • SKU: <strong>{product.sku}</strong> • {product.department}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-extrabold text-brand-primary text-xs">{formatBRL(displayPrice)}</div>
                      <div className={`text-[10px] font-bold ${totalStock > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {totalStock > 0 ? `${totalStock} em estoque` : 'Sem Estoque'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* Selected Product Configuration Box */}
        {selectedProduct && (
          <Card className="p-5 border-2 border-brand-primary bg-white animate-in slide-in-from-top-3">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
              <div className="flex gap-3 min-w-0">
                <img
                  src={selectedProduct.images[0]}
                  alt={selectedProduct.name}
                  className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <Badge variant="gold" className="text-[10px] mb-1">{selectedProduct.department}</Badge>
                  <h3 className="font-extrabold text-slate-900 text-sm">{selectedProduct.name}</h3>
                  <p className="text-xs text-slate-500">Marca: {selectedProduct.brand} | SKU: {selectedProduct.sku}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-lg font-black text-brand-primary">
                  {formatBRL(selectedProduct.promoPrice || selectedProduct.salePrice)}
                </div>
                {selectedProduct.promoPrice && (
                  <div className="text-xs text-slate-400 line-through">
                    {formatBRL(selectedProduct.salePrice)}
                  </div>
                )}
              </div>
            </div>

            {/* Colors Selection */}
            <div className="space-y-3 pt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Selecione a Cor:</label>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(selectedProduct.variants.map(v => v.color))).map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleColorChange(color)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        selectedColor === color
                          ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizes Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Selecione a Numeração / Tamanho:</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {selectedProduct.variants
                    .filter(v => v.color === selectedColor)
                    .map(variant => {
                      const isSelected = selectedVariant?.id === variant.id;
                      const hasStock = variant.stock > 0;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          disabled={!hasStock}
                          onClick={() => setSelectedVariant(variant)}
                          className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-brand-primary text-white border-brand-primary ring-2 ring-brand-gold/70'
                              : hasStock
                              ? 'bg-white text-slate-800 border-slate-200 hover:border-slate-400'
                              : 'bg-slate-100 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="font-extrabold text-xs">{variant.size}</div>
                          <div className={`text-[10px] font-medium ${isSelected ? 'text-brand-gold' : hasStock ? 'text-emerald-700' : 'text-rose-500'}`}>
                            {hasStock ? `${variant.stock} un` : 'Esgotado'}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Quantity & Add Button */}
              <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setItemQuantity(prev => Math.max(1, prev - 1))}
                    className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-black text-sm text-slate-900">{itemQuantity}</span>
                  <button
                    type="button"
                    onClick={() => setItemQuantity(prev => (selectedVariant ? Math.min(selectedVariant.stock, prev + 1) : prev + 1))}
                    className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  className="flex-1 shadow-md py-3"
                  onClick={handleAddItemToCart}
                  disabled={!selectedVariant || selectedVariant.stock <= 0}
                  icon={<ShoppingBag className="w-4 h-4 text-white" />}
                >
                  Adicionar ao Caixa • {formatBRL((selectedProduct.promoPrice || selectedProduct.salePrice) * itemQuantity)}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Customer Identification Card with Autocomplete & Quick Register */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-brand-primary" />
              <span>Cliente Vinculado (Obrigatório para Nota Promissória)</span>
            </h3>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewCustomerModalOpen(true)}
              icon={<UserPlus className="w-3.5 h-3.5 text-brand-primary" />}
              className="text-xs py-1 px-2.5"
            >
              + Novo Cliente
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Selecionar Cliente Cadastrado:
              </label>
              <select
                value={selectedCustomerId}
                onChange={e => handleCustomerChange(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="">-- Cliente Avulso / Consumidor Final --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} • CPF: {c.cpfCnpj} • Limite: {formatBRL(c.creditLimit)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Nome do Cliente"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Ex: Sandra Cristina dos Santos"
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

            {selectedCustomerObj && (
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600">
                  Endereço: <strong>{selectedCustomerObj.address || 'Quatro Barras - PR'}</strong>
                </span>
                <span className="text-emerald-700 font-bold">
                  Limite Disponível: {formatBRL(selectedCustomerObj.creditLimit)}
                </span>
              </div>
            )}
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
                <button type="button" onClick={() => setCartItems([])} className="text-xs text-rose-600 font-medium hover:underline cursor-pointer">
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
                        SKU: {item.sku} | Tam: <strong>{item.selectedSize}</strong> | Cor: <strong>{item.selectedColor}</strong>
                      </div>
                      <div className="font-semibold text-brand-primary mt-0.5">{formatBRL(item.unitPrice)} cada</div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center border border-slate-200 rounded bg-white">
                        <button type="button" onClick={() => handleUpdateCartQty(item.variantId, -1)} className="px-1.5 py-0.5 text-slate-600 cursor-pointer">-</button>
                        <span className="px-2 font-bold">{item.quantity}</span>
                        <button type="button" onClick={() => handleUpdateCartQty(item.variantId, 1)} className="px-1.5 py-0.5 text-slate-600 cursor-pointer">+</button>
                      </div>

                      <span className="font-bold text-slate-900 w-16 text-right">{formatBRL(item.total)}</span>

                      <button type="button" onClick={() => handleRemoveCartItem(item.variantId)} className="text-slate-400 hover:text-rose-600 cursor-pointer">
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
                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${discountType === 'fixed' ? 'bg-brand-primary text-white' : 'bg-slate-200 text-slate-700'}`}
                  >
                    R$ Real
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${discountType === 'percent' ? 'bg-brand-primary text-white' : 'bg-slate-200 text-slate-700'}`}
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
              Avançar para Pagamento ({formatBRL(totalAmount)})
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
        maxWidth="2xl"
      >
        <form onSubmit={handleFinalizeSale} className="space-y-6">
          {/* Payment Method Selector Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Selecione o Meio de Pagamento:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('money')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                  paymentMethod === 'money' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <span>Dinheiro</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                  paymentMethod === 'pix' ? 'bg-teal-600 text-white border-teal-600 shadow-md ring-2 ring-teal-300' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span>PIX Instantâneo</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('credit_card')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                  paymentMethod === 'credit_card' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Cartão Crédito</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('debit_card')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                  paymentMethod === 'debit_card' ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Cartão Débito</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('promissory_note')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-all col-span-2 sm:col-span-1 ${
                  paymentMethod === 'promissory_note' ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-300' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>Promissória</span>
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
            <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-300 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                <div className="text-xs font-bold text-amber-950 uppercase flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-700" />
                  <span>Emissão de Crediário / Nota Promissória</span>
                </div>
                <Badge variant="gold" className="text-[10px]">
                  Total: {formatBRL(totalAmount)}
                </Badge>
              </div>

              {/* Customer Verification */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cliente Devedor *
                  </label>
                  <Input
                    required
                    placeholder="Nome do cliente"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    CPF / CNPJ *
                  </label>
                  <Input
                    required
                    placeholder="000.000.000-00"
                    value={customerCpf}
                    onChange={e => setCustomerCpf(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp / Telefone
                  </label>
                  <Input
                    placeholder="(41) 99999-9999"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Installments Setup */}
              <div className="space-y-2 pt-2 border-t border-amber-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-950">
                    Número de Parcelas do Crediário:
                  </label>
                  <select
                    value={promissoryNumInstallments}
                    onChange={e => setPromissoryNumInstallments(Number(e.target.value))}
                    className="border border-amber-300 rounded-lg px-3 py-1.5 text-xs font-bold bg-white text-slate-900"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                      <option key={num} value={num}>
                        {num}x de {formatBRL(totalAmount / num)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Installments Detailed Breakdown Table */}
                <div className="bg-white rounded-xl border border-amber-200 overflow-hidden mt-3">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-amber-100/70 border-b border-amber-200 text-[10px] uppercase font-bold text-amber-900">
                      <tr>
                        <th className="py-2 px-3">Parcela</th>
                        <th className="py-2 px-3">Nº Doc</th>
                        <th className="py-2 px-3">Data Vencimento</th>
                        <th className="py-2 px-3 text-right">Valor (R$)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100 text-slate-700">
                      {promissoryInstallmentsList.map((inst, idx) => (
                        <tr key={inst.id} className="hover:bg-amber-50/50">
                          <td className="py-2 px-3 font-bold text-slate-900">
                            {inst.installmentNumber}/{inst.totalInstallments}
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                            {inst.documentNumber}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="date"
                              value={inst.dueDate}
                              onChange={e => {
                                const newDate = e.target.value;
                                setPromissoryInstallmentsList(prev =>
                                  prev.map((it, i) => (i === idx ? { ...it, dueDate: newDate } : it))
                                );
                              }}
                              className="border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-800 bg-white"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            {formatBRL(inst.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
              Finalizar Venda & Emitir Recibo Elgin i9
            </Button>
          </div>
        </form>
      </Modal>

      {/* Customer Quick Registration Modal */}
      <CustomerFormModal
        customer={null}
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
      />
    </div>
  );
};
