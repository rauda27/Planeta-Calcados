'use client';

import React from 'react';
import { useStore } from '../../context/StoreContext';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { Trash2, Plus, Minus, MessageCircle, ShoppingBag, ArrowRight } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateCartQuantity, clearCart } = useStore();

  const totalAmount = cart.reduce((sum, item) => {
    const price = item.product.promoPrice || item.product.salePrice;
    return sum + price * item.quantity;
  }, 0);

  const formatPrice = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

  // WhatsApp Message Generator according to exact prompt template
  const generateWhatsAppLink = () => {
    if (cart.length === 0) return '#';

    let message = `Olá, Planeta Calçados! Gostaria de cotar os seguintes itens:\n`;
    
    cart.forEach(item => {
      const price = item.product.promoPrice || item.product.salePrice;
      message += `- ${item.quantity}x ${item.product.name} - Tamanho: [${item.selectedSize}] - Cor: [${item.selectedColor}] - ${formatPrice(price)}\n`;
    });

    message += `\nTotal da cotação: ${formatPrice(totalAmount)}\n`;
    message += `Aguardo retorno com opções de pagamento e entrega!`;

    // Brazilian WhatsApp number (Planeta Calçados)
    const phone = '5511999998888';
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <Drawer
      isOpen={isCartOpen}
      onClose={() => setIsCartOpen(false)}
      title="Carrinho de Cotação"
      subtitle={`${cart.reduce((acc, item) => acc + item.quantity, 0)} calçado(s) selecionado(s)`}
      footer={
        cart.length > 0 ? (
          <div className="space-y-4">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal dos Itens:</span>
                <span className="font-semibold text-slate-800">{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Atendimento & Frete:</span>
                <span className="text-emerald-700 font-semibold">A calcular via WhatsApp</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Estimado:</span>
                <span className="text-brand-primary">{formatPrice(totalAmount)}</span>
              </div>
            </div>

            {/* WhatsApp Finish Button */}
            <a
              href={generateWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <Button
                variant="gold"
                size="lg"
                className="w-full shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 py-3.5 flex items-center justify-center gap-2 text-sm font-bold cursor-pointer"
                icon={<MessageCircle className="w-5 h-5 text-white fill-white" />}
              >
                <span>Finalizar Cotação no WhatsApp</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </a>

            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span>Sua mensagem será pré-formatada.</span>
              <button
                onClick={clearCart}
                className="text-rose-500 hover:underline hover:text-rose-600 font-medium"
              >
                Esvaziar carrinho
              </button>
            </div>
          </div>
        ) : undefined
      }
    >
      {cart.length === 0 ? (
        <div className="py-16 text-center space-y-4 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <ShoppingBag className="w-8 h-8 text-brand-primary/40" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Sua cotação está vazia</h3>
          <p className="text-xs text-slate-500 max-w-xs">
            Navegue pelo nosso catálogo, selecione a numeração desejada e adicione os calçados aqui.
          </p>
          <Button variant="outline" size="sm" onClick={() => setIsCartOpen(false)}>
            Continuar Explorando
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {cart.map(item => {
            const price = item.product.promoPrice || item.product.salePrice;
            return (
              <div
                key={item.id}
                className="flex gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                {/* Thumbnail */}
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-16 h-16 rounded-lg object-cover bg-white border border-slate-200 shrink-0"
                />

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold text-slate-700">
                        Tam: {item.selectedSize}
                      </span>
                      <span>Cor: <strong>{item.selectedColor}</strong></span>
                    </div>
                  </div>

                  {/* Quantity & Price */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60">
                    <div className="flex items-center border border-slate-200 rounded-md bg-white">
                      <button
                        onClick={() => updateCartQuantity(item.id, -1)}
                        className="p-1 hover:bg-slate-100 text-slate-600"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2.5 text-xs font-bold text-slate-800">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.id, 1)}
                        className="p-1 hover:bg-slate-100 text-slate-600"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-xs font-bold text-brand-primary">
                      {formatPrice(price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* WhatsApp Raw Preview Box */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-slate-700 space-y-1 mt-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
              Prévia da Mensagem Formatada:
            </span>
            <div className="text-[11px] font-mono text-emerald-950 whitespace-pre-wrap bg-white/80 p-2.5 rounded-lg border border-emerald-100 leading-tight">
              {`Olá, Planeta Calçados! Gostaria de cotar os seguintes itens:\n` +
                cart
                  .map(
                    item =>
                      `- ${item.quantity}x ${item.product.name} - Tamanho: [${item.selectedSize}] - Cor: [${item.selectedColor}] - ${formatPrice(
                        (item.product.promoPrice || item.product.salePrice) * item.quantity
                      )}`
                  )
                  .join('\n') +
                `\nTotal da cotação: ${formatPrice(totalAmount)}\nAguardo retorno com opções de pagamento e entrega!`}
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
};
