'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Bill, CartItem, BillStatus, Sale, SaleStatus, SaleItem } from '../types';
import { INITIAL_PRODUCTS, INITIAL_BILLS, INITIAL_SALES } from '../data/mockData';

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error' | 'warning';
}

interface StoreContextType {
  products: Product[];
  bills: Bill[];
  sales: Sale[];
  cart: CartItem[];
  isCartOpen: boolean;
  toasts: ToastState[];
  
  // Product actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateVariantStock: (productId: string, variantId: string, newStock: number) => void;
  
  // Bill actions
  addBill: (bill: Omit<Bill, 'id' | 'createdAt'>) => void;
  updateBillStatus: (billId: string, status: BillStatus) => void;
  deleteBill: (billId: string) => void;
  
  // Sales & POS actions
  addSale: (saleData: Omit<Sale, 'id' | 'code' | 'createdAt'>) => Sale;
  updateSale: (saleId: string, updatedFields: Partial<Sale>, newItems?: SaleItem[]) => void;
  deleteSale: (saleId: string) => void;
  markPromissoryAsPaid: (saleId: string) => void;
  cancelSale: (saleId: string) => void;

  // System Clean / Delivery Action
  clearERPTransactionsForDelivery: () => void;

  // Cart actions
  addToCart: (product: Product, selectedSize: string | number, selectedColor: string, quantity?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  setIsCartOpen: (isOpen: boolean) => void;
  
  // Toast action
  showToast: (message: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from LocalStorage or Clean Empty State
  useEffect(() => {
    try {
      const savedProducts = localStorage.getItem('planeta_products');
      const savedBills = localStorage.getItem('planeta_bills');
      const savedSales = localStorage.getItem('planeta_sales');
      const savedCart = localStorage.getItem('planeta_cart');

      const parsedProducts: Product[] = savedProducts ? JSON.parse(savedProducts) : [];
      const parsedBills: Bill[] = savedBills ? JSON.parse(savedBills) : [];
      const parsedSales: Sale[] = savedSales ? JSON.parse(savedSales) : [];
      const parsedCart: CartItem[] = savedCart ? JSON.parse(savedCart) : [];

      setProducts(parsedProducts);
      setBills(parsedBills);
      setSales(parsedSales);
      setCart(parsedCart);
    } catch (e) {
      console.error('Error loading localStorage data:', e);
      setProducts([]);
      setBills([]);
      setSales([]);
      setCart([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync state to LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('planeta_products', JSON.stringify(products));
    } catch (e) { console.error(e); }
  }, [products, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('planeta_bills', JSON.stringify(bills));
    } catch (e) { console.error(e); }
  }, [bills, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('planeta_sales', JSON.stringify(sales));
    } catch (e) { console.error(e); }
  }, [sales, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('planeta_cart', JSON.stringify(cart));
    } catch (e) { console.error(e); }
  }, [cart, isLoaded]);

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'info' | 'error' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Product Actions
  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setProducts(prev => [newProduct, ...prev]);
    showToast(`Produto "${newProduct.name}" cadastrado com sucesso!`);
  };

  const updateProduct = (id: string, productData: Partial<Product>) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          return {
            ...p,
            ...productData,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );
    showToast(`Produto atualizado com sucesso!`);
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast(`Produto removido do catálogo!`, 'info');
  };

  const updateVariantStock = (productId: string, variantId: string, newStock: number) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          const updatedVariants = p.variants.map(v =>
            v.id === variantId ? { ...v, stock: Math.max(0, newStock) } : v
          );
          return {
            ...p,
            variants: updatedVariants,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );
    showToast(`Estoque da numeração atualizado!`);
  };

  // Bill Actions
  const addBill = (billData: Omit<Bill, 'id' | 'createdAt'>) => {
    const newBill: Bill = {
      ...billData,
      id: `bill-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setBills(prev => [newBill, ...prev]);
    showToast(`Boleto de R$ ${newBill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} cadastrado!`);
  };

  const updateBillStatus = (billId: string, status: BillStatus) => {
    setBills(prev =>
      prev.map(b => (b.id === billId ? { ...b, status } : b))
    );
    const statusText = status === 'Pago' ? 'marcado como PAGO' : status === 'Atrasado' ? 'marcado como ATRASADO' : 'marcado como PENDENTE';
    showToast(`Boleto ${statusText}!`, status === 'Pago' ? 'success' : 'warning');
  };

  const deleteBill = (billId: string) => {
    setBills(prev => prev.filter(b => b.id !== billId));
    showToast(`Boleto excluído com sucesso!`, 'info');
  };

  // -------------------------------------------------------------
  // POS & Sales Actions (WITH AUTOMATIC STOCK DEDUCTION / RESTORATION)
  // -------------------------------------------------------------
  const addSale = (saleData: Omit<Sale, 'id' | 'code' | 'createdAt'>): Sale => {
    const now = new Date().toISOString();
    const saleCode = `VENDA-${Math.floor(1000 + Math.random() * 9000)}`;
    const newSale: Sale = {
      ...saleData,
      id: `sale-${Date.now()}`,
      code: saleCode,
      createdAt: now,
    };

    // AUTOMATIC STOCK DEDUCTION IN PRODUCT MATRIX
    setProducts(prevProducts =>
      prevProducts.map(product => {
        let hasProductInSale = false;

        const updatedVariants = product.variants.map(variant => {
          const matchingItem = saleData.items.find(
            item => item.productId === product.id && item.variantId === variant.id
          );

          if (matchingItem) {
            hasProductInSale = true;
            const newStock = Math.max(0, variant.stock - matchingItem.quantity);
            return { ...variant, stock: newStock };
          }
          return variant;
        });

        if (hasProductInSale) {
          return {
            ...product,
            variants: updatedVariants,
            updatedAt: now,
          };
        }
        return product;
      })
    );

    setSales(prev => [newSale, ...prev]);
    showToast(`Venda ${saleCode} realizada com sucesso e estoque atualizado!`, 'success');
    return newSale;
  };

  // UPDATE SALE WITH AUTOMATIC INVENTORY ADJUSTMENT FOR EDITED ITEMS
  const updateSale = (
    saleId: string,
    updatedFields: Partial<Sale>,
    newItems?: SaleItem[]
  ) => {
    const originalSale = sales.find(s => s.id === saleId);
    if (!originalSale) return;

    const itemsToSave = newItems || originalSale.items;

    // IF ITEMS WERE EDITED/REPLACED, AUTOMATICALLY RECONCILE PRODUCT STOCK
    if (newItems && originalSale.status !== 'cancelled') {
      setProducts(prevProducts =>
        prevProducts.map(product => {
          let modified = false;

          const updatedVariants = product.variants.map(variant => {
            // Find old sold quantity in original sale
            const oldItem = originalSale.items.find(
              i => i.productId === product.id && i.variantId === variant.id
            );
            const oldQty = oldItem ? oldItem.quantity : 0;

            // Find new sold quantity in updated sale
            const newItem = newItems.find(
              i => i.productId === product.id && i.variantId === variant.id
            );
            const newQty = newItem ? newItem.quantity : 0;

            const diff = oldQty - newQty; // If diff > 0 (sold less), returns to stock. If diff < 0 (sold more), deducts from stock.
            if (diff !== 0) {
              modified = true;
              return { ...variant, stock: Math.max(0, variant.stock + diff) };
            }
            return variant;
          });

          if (modified) {
            return {
              ...product,
              variants: updatedVariants,
              updatedAt: new Date().toISOString(),
            };
          }
          return product;
        })
      );
    }

    const calculatedSubtotal = itemsToSave.reduce((acc, i) => acc + i.total, 0);
    const calculatedDiscount =
      updatedFields.discount !== undefined ? updatedFields.discount : originalSale.discount;
    const calculatedTotal = Math.max(0, calculatedSubtotal - calculatedDiscount);

    setSales(prev =>
      prev.map(s => {
        if (s.id === saleId) {
          return {
            ...s,
            ...updatedFields,
            items: itemsToSave,
            subtotal: calculatedSubtotal,
            discount: calculatedDiscount,
            total: calculatedTotal,
          };
        }
        return s;
      })
    );

    showToast(`Venda ${originalSale.code} atualizada e estoque ajustado com sucesso!`, 'success');
  };

  // DELETE SALE WITH AUTOMATIC STOCK RESTORATION
  const deleteSale = (saleId: string) => {
    const saleToDelete = sales.find(s => s.id === saleId);
    if (!saleToDelete) return;

    // AUTOMATICALLY RESTORE ALL QUANTITIES BACK TO PRODUCT STOCK
    if (saleToDelete.status !== 'cancelled' && saleToDelete.items?.length > 0) {
      setProducts(prevProducts =>
        prevProducts.map(product => {
          let modified = false;

          const updatedVariants = product.variants.map(variant => {
            const soldItem = saleToDelete.items.find(
              item => item.productId === product.id && item.variantId === variant.id
            );

            if (soldItem && soldItem.quantity > 0) {
              modified = true;
              return { ...variant, stock: variant.stock + soldItem.quantity };
            }
            return variant;
          });

          if (modified) {
            return {
              ...product,
              variants: updatedVariants,
              updatedAt: new Date().toISOString(),
            };
          }
          return product;
        })
      );
    }

    setSales(prev => prev.filter(s => s.id !== saleId));
    showToast(`Venda ${saleToDelete.code} excluída e itens estornados para o estoque!`, 'info');
  };

  const markPromissoryAsPaid = (saleId: string) => {
    const now = new Date().toISOString();
    setSales(prev =>
      prev.map(s => {
        if (s.id === saleId) {
          return {
            ...s,
            status: 'completed' as SaleStatus,
            paymentDetails: s.paymentDetails?.promissory
              ? {
                  ...s.paymentDetails,
                  promissory: {
                    ...s.paymentDetails.promissory,
                    isPaid: true,
                    paidAt: now,
                  },
                }
              : s.paymentDetails,
          };
        }
        return s;
      })
    );
    showToast(`Baixa efetuada! Nota promissória quitada com sucesso.`, 'success');
  };

  const cancelSale = (saleId: string) => {
    const saleToCancel = sales.find(s => s.id === saleId);
    if (!saleToCancel) return;

    // When cancelling, also restore stock
    if (saleToCancel.status !== 'cancelled' && saleToCancel.items?.length > 0) {
      setProducts(prevProducts =>
        prevProducts.map(product => {
          let modified = false;
          const updatedVariants = product.variants.map(variant => {
            const soldItem = saleToCancel.items.find(
              item => item.productId === product.id && item.variantId === variant.id
            );
            if (soldItem && soldItem.quantity > 0) {
              modified = true;
              return { ...variant, stock: variant.stock + soldItem.quantity };
            }
            return variant;
          });

          if (modified) {
            return {
              ...product,
              variants: updatedVariants,
              updatedAt: new Date().toISOString(),
            };
          }
          return product;
        })
      );
    }

    setSales(prev =>
      prev.map(s => (s.id === saleId ? { ...s, status: 'cancelled' as SaleStatus } : s))
    );
    showToast(`Venda cancelada e estoque estornado.`, 'warning');
  };

  // -------------------------------------------------------------
  // SYSTEM WIPE / DELIVERY TO CLIENT ACTION
  // -------------------------------------------------------------
  const clearERPTransactionsForDelivery = () => {
    try {
      setSales([]);
      setBills([]);
      setCart([]);
      localStorage.removeItem('planeta_sales');
      localStorage.removeItem('planeta_bills');
      localStorage.removeItem('planeta_cart');
      localStorage.setItem('planeta_sales', JSON.stringify([]));
      localStorage.setItem('planeta_bills', JSON.stringify([]));
      localStorage.setItem('planeta_cart', JSON.stringify([]));
      showToast('🧹 ERP limpo com sucesso! Histórico de vendas e contas zerados para entrega ao cliente.', 'success');
    } catch (e) {
      console.error('Error clearing ERP data:', e);
    }
  };

  // Cart Actions
  const addToCart = (product: Product, selectedSize: string | number, selectedColor: string, quantity = 1) => {
    const cartItemId = `${product.id}-${selectedColor}-${selectedSize}`;
    setCart(prev => {
      const existing = prev.find(item => item.id === cartItemId);
      if (existing) {
        return prev.map(item =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { id: cartItemId, product, selectedSize, selectedColor, quantity }];
    });
    setIsCartOpen(true);
    showToast(`Item (${selectedColor} / Tam: ${selectedSize}) adicionado à cotação!`);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
    showToast('Item removido da cotação.', 'info');
  };

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        bills,
        sales,
        cart,
        isCartOpen,
        toasts,
        addProduct,
        updateProduct,
        deleteProduct,
        updateVariantStock,
        addBill,
        updateBillStatus,
        deleteBill,
        addSale,
        updateSale,
        deleteSale,
        markPromissoryAsPaid,
        cancelSale,
        clearERPTransactionsForDelivery,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        setIsCartOpen,
        showToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
