'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useStore } from '../../context/StoreContext';
import { ShoppingBag, Check, ShieldAlert, Heart, Share2, Sparkles, MessageSquare } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { addToCart } = useStore();

  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string | number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  useEffect(() => {
    if (product) {
      const firstColor = product.variants[0]?.color || '';
      setSelectedColor(firstColor);

      const inStockVariant = product.variants.find(v => v.color === firstColor && v.stock > 0);
      setSelectedSize(inStockVariant ? inStockVariant.size : product.variants[0]?.size || null);
      setQuantity(1);
      setSelectedImageIndex(0);
    }
  }, [product]);

  if (!product) return null;

  const availableColors = Array.from(
    new Set(product.variants.map(v => v.color))
  );

  const availableSizesForColor = product.variants
    .filter(v => v.color === selectedColor)
    .map(v => ({
      size: v.size,
      stock: v.stock,
    }));

  const currentVariant = product.variants.find(
    v => v.color === selectedColor && String(v.size) === String(selectedSize)
  );

  const currentStock = currentVariant ? currentVariant.stock : 0;

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    const sizeInNewColor = product.variants.find(
      v => v.color === color && String(v.size) === String(selectedSize) && v.stock > 0
    );

    if (!sizeInNewColor) {
      const firstAvailableInNewColor = product.variants.find(
        v => v.color === color && v.stock > 0
      );
      setSelectedSize(firstAvailableInNewColor ? firstAvailableInNewColor.size : null);
    }
  };

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor || currentStock === 0) return;
    addToCart(product, selectedSize, selectedColor, quantity);
    onClose();
  };

  const hasDiscount = !!(product.promoPrice && product.promoPrice < product.salePrice);
  const displayPrice = product.promoPrice || product.salePrice;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shadow-soft">
            <img
              src={product.images?.[selectedImageIndex] || product.images?.[0] || 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&auto=format&fit=crop&q=60'}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
            {hasDiscount && (
              <Badge variant="gold" className="absolute top-4 left-4 font-bold">
                OFERTA DA SEMANA
              </Badge>
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    selectedImageIndex === idx
                      ? 'border-brand-primary ring-2 ring-brand-gold/50'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Technical Specs List */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2">
              Ficha Técnica do Produto
            </h4>
            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div>
                <span className="font-semibold text-slate-500">Departamento:</span>{' '}
                <span className="font-medium text-slate-900">{product.department}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Material:</span>{' '}
                <span className="font-medium text-slate-900">{product.material}</span>
              </div>
              {product.soleType && (
                <div>
                  <span className="font-semibold text-slate-500">Solado:</span>{' '}
                  <span className="font-medium text-slate-900">{product.soleType}</span>
                </div>
              )}
              <div>
                <span className="font-semibold text-slate-500">Gênero:</span>{' '}
                <span className="font-medium text-slate-900">{product.gender}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Coleção:</span>{' '}
                <span className="font-medium text-slate-900">{product.collection}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Product Specs & Options */}
        <div className="flex flex-col justify-between space-y-6">
          <div>
            {/* Category & Brand */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <Badge variant="emerald">{product.brand}</Badge>
              <span className="text-xs font-mono text-slate-400">SKU: {product.sku}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {product.name}
            </h2>
            <p className="text-xs text-slate-500 mt-1">Modelo: {product.model}</p>

            {/* Price Box */}
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-slate-50 border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 block">Preço Especial de Cotação</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-brand-primary">
                    R$ {displayPrice.toFixed(2).replace('.', ',')}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm text-slate-400 line-through">
                      R$ {product.salePrice.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full font-bold">
                  Pronta Entrega
                </span>
              </div>
            </div>

            {/* Color Selector */}
            <div className="mt-6">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                1. Selecione a Cor: <span className="text-brand-primary">{selectedColor}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {availableColors.map(color => {
                  const isSelected = selectedColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleColorSelect(color)}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-brand-primary bg-brand-primary text-white shadow-xs ring-2 ring-brand-gold/40'
                          : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <span>{color}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Selector */}
            <div className="mt-6">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                2. Selecione o Tamanho / Numeração ({product.department}):
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSizesForColor.map(({ size, stock }) => {
                  const isSelected = String(selectedSize) === String(size);
                  const isAvailable = stock > 0;

                  return (
                    <button
                      key={String(size)}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold flex flex-col items-center min-w-[50px] transition-all cursor-pointer ${
                        !isAvailable
                          ? 'opacity-40 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                          : isSelected
                          ? 'border-brand-primary bg-brand-primary text-white shadow-sm ring-2 ring-brand-gold/40'
                          : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <span>{size}</span>
                      {isAvailable && (
                        <span className={`text-[9px] font-normal ${isSelected ? 'text-brand-gold' : 'text-slate-400'}`}>
                          {stock} un
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Stock Warning */}
              {selectedSize && (
                <div className="mt-3 text-xs flex items-center gap-2">
                  {currentStock > 0 ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-4 h-4 text-emerald-600" />
                      Variação ({selectedSize}) disponível em estoque ({currentStock} unidades na loja)
                    </span>
                  ) : (
                    <span className="text-rose-600 font-semibold flex items-center gap-1">
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                      Variação ({selectedSize}) indisponível no momento
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="mt-6 flex items-center gap-4">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Quantidade:
              </label>
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 text-sm font-bold"
                >
                  -
                </button>
                <span className="px-4 py-1 text-sm font-bold text-slate-900">{quantity}</span>
                <button
                  type="button"
                  disabled={quantity >= currentStock}
                  onClick={() => setQuantity(q => Math.min(currentStock, q + 1))}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 text-sm font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full shadow-md py-3 text-sm font-bold"
              disabled={!selectedSize || currentStock === 0}
              onClick={handleAddToCart}
              icon={<ShoppingBag className="w-5 h-5 text-brand-gold" />}
            >
              {!selectedSize
                ? 'Selecione a numeração/tamanho'
                : currentStock === 0
                ? 'Sem Estoque Disponível'
                : `Adicionar ${quantity}x à Cotação • R$ ${(displayPrice * quantity).toFixed(2).replace('.', ',')}`}
            </Button>

            {/* Direct High-Converting WhatsApp CTA Button */}
            {selectedSize && currentStock > 0 && (
              <a
                href={`https://wa.me/5541991543389?text=${encodeURIComponent(
                  `Olá, Planeta Calçados QB! Quero cotar/comprar o produto:\n- ${product.name} (${product.brand})\n- Tamanho: ${selectedSize}\n- Cor: ${selectedColor}\n- Quantidade: ${quantity}x\n- Valor: R$ ${(displayPrice * quantity).toFixed(2).replace('.', ',')}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-emerald transition-all duration-200 cursor-pointer text-center"
              >
                <MessageSquare className="w-5 h-5 text-white" />
                <span>Finalizar Pedido Direto no WhatsApp</span>
              </a>
            )}

            <p className="text-[11px] text-center text-slate-400 mt-2">
              Seus itens serão agrupados para envio direto ao atendimento via WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
