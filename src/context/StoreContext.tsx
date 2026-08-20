'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Product, Bill, CartItem, BillStatus, Sale, SaleStatus, SaleItem } from '../types';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

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
  isLoaded: boolean;
  isCloudConnected: boolean;
  cloudError: string | null;
  
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
  clearAllDataFromDatabase: () => void;

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

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

const STORAGE_KEYS = {
  PRODUCTS: 'planeta_products',
  BILLS: 'planeta_bills',
  SALES: 'planeta_sales',
  CART: 'planeta_cart',
};

// Safe helper to strip undefined keys so Firestore never rejects data
const sanitizeForFirestore = <T>(data: T): T => {
  return JSON.parse(
    JSON.stringify(data, (_, v) => (v === undefined ? null : v))
  );
};

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);

  // Safe localStorage helper
  const saveToLocalStorage = (key: string, data: any) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch (err) {
      console.error(`Error saving ${key} to localStorage:`, err);
    }
  };

  // Toast Helper
  const showToast = useCallback(
    (message: string, type: 'success' | 'info' | 'error' | 'warning' = 'success') => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    },
    []
  );

  // 1. Initial Load from LocalStorage Cache
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
        const savedBills = localStorage.getItem(STORAGE_KEYS.BILLS);
        const savedSales = localStorage.getItem(STORAGE_KEYS.SALES);
        const savedCart = localStorage.getItem(STORAGE_KEYS.CART);

        if (savedProducts) setProducts(JSON.parse(savedProducts));
        if (savedBills) setBills(JSON.parse(savedBills));
        if (savedSales) setSales(JSON.parse(savedSales));
        if (savedCart) setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error('Error loading initial cache:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 2. Real-time Cloud Synchronization with Firebase Firestore
  useEffect(() => {
    if (!db || !isFirebaseConfigured) {
      setIsCloudConnected(false);
      return;
    }

    try {
      // Sync Products
      const unsubProducts = onSnapshot(
        collection(db, 'products'),
        snapshot => {
          setIsCloudConnected(true);
          setCloudError(null);
          const cloudProducts: Product[] = [];
          snapshot.forEach(docSnap => {
            cloudProducts.push(docSnap.data() as Product);
          });
          cloudProducts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          
          setProducts(cloudProducts);
          saveToLocalStorage(STORAGE_KEYS.PRODUCTS, cloudProducts);
        },
        error => {
          console.error('🔥 Firestore Products error:', error);
          setIsCloudConnected(false);
          setCloudError(error.message);
        }
      );

      // Sync Sales
      const unsubSales = onSnapshot(
        collection(db, 'sales'),
        snapshot => {
          const cloudSales: Sale[] = [];
          snapshot.forEach(docSnap => {
            cloudSales.push(docSnap.data() as Sale);
          });
          cloudSales.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setSales(cloudSales);
          saveToLocalStorage(STORAGE_KEYS.SALES, cloudSales);
        },
        error => {
          console.error('🔥 Firestore Sales error:', error);
        }
      );

      // Sync Bills
      const unsubBills = onSnapshot(
        collection(db, 'bills'),
        snapshot => {
          const cloudBills: Bill[] = [];
          snapshot.forEach(docSnap => {
            cloudBills.push(docSnap.data() as Bill);
          });
          cloudBills.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setBills(cloudBills);
          saveToLocalStorage(STORAGE_KEYS.BILLS, cloudBills);
        },
        error => {
          console.error('🔥 Firestore Bills error:', error);
        }
      );

      return () => {
        unsubProducts();
        unsubSales();
        unsubBills();
      };
    } catch (err: any) {
      console.error('Firebase connection setup failed:', err);
      setIsCloudConnected(false);
      setCloudError(err?.message || 'Erro ao conectar ao Firebase');
    }
  }, []);

  // -------------------------------------------------------------
  // Product Actions (Cloud Firestore + LocalStorage Hybrid)
  // -------------------------------------------------------------
  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };

    // Update Local State & Storage immediately
    setProducts(prev => {
      const updated = [newProduct, ...prev];
      saveToLocalStorage(STORAGE_KEYS.PRODUCTS, updated);
      return updated;
    });

    // Sync to Cloud Firestore with sanitization
    if (db && isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'products', newProduct.id), sanitizeForFirestore(newProduct));
        setIsCloudConnected(true);
      } catch (err: any) {
        console.error('🔥 Error saving product to Firebase:', err);
        setCloudError(err?.message || 'Erro ao salvar no Firestore');
      }
    }

    showToast(`Produto "${newProduct.name}" salvo com sucesso!`, 'success');
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    let updatedTarget: Product | null = null;

    setProducts(prev => {
      const updated = prev.map(p => {
        if (p.id === id) {
          updatedTarget = {
            ...p,
            ...productData,
            updatedAt: new Date().toISOString(),
          };
          return updatedTarget;
        }
        return p;
      });
      saveToLocalStorage(STORAGE_KEYS.PRODUCTS, updated);
      return updated;
    });

    if (db && isFirebaseConfigured && updatedTarget) {
      try {
        await setDoc(doc(db, 'products', id), sanitizeForFirestore(updatedTarget));
      } catch (err: any) {
        console.error('🔥 Error updating product in Firebase:', err);
      }
    }

    showToast(`Produto atualizado com sucesso!`, 'success');
  };

  const deleteProduct = async (id: string) => {
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== id);
      saveToLocalStorage(STORAGE_KEYS.PRODUCTS, updated);
      return updated;
    });

    if (db && isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (err: any) {
        console.error('🔥 Error deleting product from Firebase:', err);
      }
    }

    showToast(`Produto removido!`, 'info');
  };

  const updateVariantStock = async (productId: string, variantId: string, newStock: number) => {
    let updatedTarget: Product | null = null;

    setProducts(prev => {
      const updated = prev.map(p => {
        if (p.id === productId) {
          const updatedVariants = p.variants.map(v =>
            v.id === variantId ? { ...v, stock: Math.max(0, newStock) } : v
          );
          updatedTarget = {
            ...p,
            variants: updatedVariants,
            updatedAt: new Date().toISOString(),
          };
          return updatedTarget;
        }
        return p;
      });
      saveToLocalStorage(STORAGE_KEYS.PRODUCTS, updated);
      return updated;
    });

    if (db && isFirebaseConfigured && updatedTarget) {
      try {
        await setDoc(doc(db, 'products', productId), sanitizeForFirestore(updatedTarget));
      } catch (err: any) {
        console.error('🔥 Error updating stock in Firebase:', err);
      }
    }

    showToast(`Estoque atualizado!`, 'success');
  };

  // -------------------------------------------------------------
  // Bill Actions
  // -------------------------------------------------------------
  const addBill = async (billData: Omit<Bill, 'id' | 'createdAt'>) => {
    const newBill: Bill = {
      ...billData,
      id: `bill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    setBills(prev => {
      const updated = [newBill, ...prev];
      saveToLocalStorage(STORAGE_KEYS.BILLS, updated);
      return updated;
    });

    if (db && isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'bills', newBill.id), sanitizeForFirestore(newBill));
      } catch (err: any) {
        console.error('🔥 Error saving bill to Firebase:', err);
      }
    }

    showToast(`Boleto de R$ ${newBill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} cadastrado!`);
  };

  const updateBillStatus = async (billId: string, status: BillStatus) => {
    let updatedTarget: Bill | null = null;

    setBills(prev => {
      const updated = prev.map(b => {
        if (b.id === billId) {
          updatedTarget = { ...b, status };
          return updatedTarget;
        }
        return b;
      });
      saveToLocalStorage(STORAGE_KEYS.BILLS, updated);
      return updated;
    });

    if (db && isFirebaseConfigured && updatedTarget) {
      try {
        await setDoc(doc(db, 'bills', billId), sanitizeForFirestore(updatedTarget));
      } catch (err: any) {
        console.error('🔥 Error updating bill in Firebase:', err);
      }
    }

    const statusText = status === 'Pago' ? 'marcado como PAGO' : status === 'Atrasado' ? 'marcado como ATRASADO' : 'marcado como PENDENTE';
    showToast(`Boleto ${statusText}!`, status === 'Pago' ? 'success' : 'warning');
  };

  const deleteBill = async (billId: string) => {
    setBills(prev => {
      const updated = prev.filter(b => b.id !== billId);
      saveToLocalStorage(STORAGE_KEYS.BILLS, updated);
      return updated;
    });

    if (db && isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, 'bills', billId));
      } catch (err: any) {
        console.error('🔥 Error deleting bill from Firebase:', err);
      }
    }

    showToast(`Boleto excluído com sucesso!`, 'info');
  };

  // -------------------------------------------------------------
  // POS & Sales Actions
  // -------------------------------------------------------------
  const addSale = (saleData: Omit<Sale, 'id' | 'code' | 'createdAt'>): Sale => {
    const now = new Date().toISOString();
    const saleCode = `VENDA-${Math.floor(1000 + Math.random() * 9000)}`;
    const newSale: Sale = {
      ...saleData,
      id: `sale_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      code: saleCode,
      createdAt: now,
    };

    // Deduct stock in state & local storage
    const updatedProducts = products.map(product => {
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
    });

    setProducts(updatedProducts);
    saveToLocalStorage(STORAGE_KEYS.PRODUCTS, updatedProducts);

    setSales(prev => {
      const updatedSales = [newSale, ...prev];
      saveToLocalStorage(STORAGE_KEYS.SALES, updatedSales);
      return updatedSales;
    });

    // Sync Sale & Stock Deductions to Firebase
    if (db && isFirebaseConfigured) {
      setDoc(doc(db, 'sales', newSale.id), sanitizeForFirestore(newSale)).catch(err =>
        console.error('🔥 Error saving sale to Firebase:', err)
      );
      updatedProducts.forEach(p => {
        setDoc(doc(db, 'products', p.id), sanitizeForFirestore(p)).catch(err =>
          console.error('🔥 Error updating stock in Firebase:', err)
        );
      });
    }

    showToast(`Venda ${saleCode} realizada com sucesso e estoque atualizado!`, 'success');
    return newSale;
  };

  const updateSale = (
    saleId: string,
    updatedFields: Partial<Sale>,
    newItems?: SaleItem[]
  ) => {
    const originalSale = sales.find(s => s.id === saleId);
    if (!originalSale) return;

    const itemsToSave = newItems || originalSale.items;

    // Reconcile stock
    let updatedProducts = products;
    if (newItems && originalSale.status !== 'cancelled') {
      updatedProducts = products.map(product => {
        let modified = false;

        const updatedVariants = product.variants.map(variant => {
          const oldItem = originalSale.items.find(
            i => i.productId === product.id && i.variantId === variant.id
          );
          const oldQty = oldItem ? oldItem.quantity : 0;

          const newItem = newItems.find(
            i => i.productId === product.id && i.variantId === variant.id
          );
          const newQty = newItem ? newItem.quantity : 0;

          const diff = oldQty - newQty;
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
      });

      setProducts(updatedProducts);
      saveToLocalStorage(STORAGE_KEYS.PRODUCTS, updatedProducts);
    }

    const calculatedSubtotal = itemsToSave.reduce((acc, i) => acc + i.total, 0);
    const calculatedDiscount =
      updatedFields.discount !== undefined ? updatedFields.discount : originalSale.discount;
    const calculatedTotal = Math.max(0, calculatedSubtotal - calculatedDiscount);

    let savedSale: Sale | null = null;
    const updatedSales = sales.map(s => {
      if (s.id === saleId) {
        savedSale = {
          ...s,
          ...updatedFields,
          items: itemsToSave,
          subtotal: calculatedSubtotal,
          discount: calculatedDiscount,
          total: calculatedTotal,
        };
        return savedSale;
      }
      return s;
    });

    setSales(updatedSales);
    saveToLocalStorage(STORAGE_KEYS.SALES, updatedSales);

    if (db && isFirebaseConfigured && savedSale) {
      setDoc(doc(db, 'sales', saleId), sanitizeForFirestore(savedSale)).catch(err =>
        console.error('🔥 Error updating sale in Firebase:', err)
      );
      updatedProducts.forEach(p => {
        setDoc(doc(db, 'products', p.id), sanitizeForFirestore(p)).catch(err =>
          console.error('🔥 Error updating stock in Firebase:', err)
        );
      });
    }

    showToast(`Venda ${originalSale.code} atualizada e salva com sucesso!`, 'success');
  };

  const deleteSale = (saleId: string) => {
    const saleToDelete = sales.find(s => s.id === saleId);
    if (!saleToDelete) return;

    let updatedProducts = products;
    if (saleToDelete.status !== 'cancelled' && saleToDelete.items?.length > 0) {
      updatedProducts = products.map(product => {
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
      });

      setProducts(updatedProducts);
      saveToLocalStorage(STORAGE_KEYS.PRODUCTS, updatedProducts);
    }

    const updatedSales = sales.filter(s => s.id !== saleId);
    setSales(updatedSales);
    saveToLocalStorage(STORAGE_KEYS.SALES, updatedSales);

    if (db && isFirebaseConfigured) {
      deleteDoc(doc(db, 'sales', saleId)).catch(err => console.error(err));
      updatedProducts.forEach(p => {
        setDoc(doc(db, 'products', p.id), sanitizeForFirestore(p)).catch(err =>
          console.error(err)
        );
      });
    }

    showToast(`Venda ${saleToDelete.code} excluída e itens estornados!`, 'info');
  };

  const markPromissoryAsPaid = (saleId: string) => {
    const now = new Date().toISOString();
    let updatedSaleTarget: Sale | null = null;

    setSales(prev => {
      const updated = prev.map(s => {
        if (s.id === saleId) {
          updatedSaleTarget = {
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
          return updatedSaleTarget;
        }
        return s;
      });
      saveToLocalStorage(STORAGE_KEYS.SALES, updated);
      return updated;
    });

    if (db && isFirebaseConfigured && updatedSaleTarget) {
      setDoc(doc(db, 'sales', saleId), sanitizeForFirestore(updatedSaleTarget)).catch(err =>
        console.error(err)
      );
    }

    showToast(`Baixa efetuada! Nota promissória quitada com sucesso.`, 'success');
  };

  const cancelSale = (saleId: string) => {
    const saleToCancel = sales.find(s => s.id === saleId);
    if (!saleToCancel) return;

    let updatedProducts = products;
    if (saleToCancel.status !== 'cancelled' && saleToCancel.items?.length > 0) {
      updatedProducts = products.map(product => {
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
      });

      setProducts(updatedProducts);
      saveToLocalStorage(STORAGE_KEYS.PRODUCTS, updatedProducts);
    }

    let updatedSaleTarget: Sale | null = null;
    const updatedSales = sales.map(s => {
      if (s.id === saleId) {
        updatedSaleTarget = { ...s, status: 'cancelled' as SaleStatus };
        return updatedSaleTarget;
      }
      return s;
    });

    setSales(updatedSales);
    saveToLocalStorage(STORAGE_KEYS.SALES, updatedSales);

    if (db && isFirebaseConfigured && updatedSaleTarget) {
      setDoc(doc(db, 'sales', saleId), sanitizeForFirestore(updatedSaleTarget)).catch(err =>
        console.error(err)
      );
      updatedProducts.forEach(p => {
        setDoc(doc(db, 'products', p.id), sanitizeForFirestore(p)).catch(err =>
          console.error(err)
        );
      });
    }

    showToast(`Venda cancelada e estoque estornado.`, 'warning');
  };

  const clearERPTransactionsForDelivery = () => {
    try {
      setSales([]);
      setBills([]);
      setCart([]);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
      }
      showToast('🧹 Vendas e boletos limpos com sucesso.', 'success');
    } catch (e) {
      console.error('Error clearing ERP data:', e);
    }
  };

  const clearAllDataFromDatabase = () => {
    try {
      const prodsToDel = [...products];
      const salesToDel = [...sales];
      const billsToDel = [...bills];

      setProducts([]);
      setSales([]);
      setBills([]);
      setCart([]);

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
      }

      if (db && isFirebaseConfigured) {
        prodsToDel.forEach(p => deleteDoc(doc(db, 'products', p.id)).catch(console.error));
        salesToDel.forEach(s => deleteDoc(doc(db, 'sales', s.id)).catch(console.error));
        billsToDel.forEach(b => deleteDoc(doc(db, 'bills', b.id)).catch(console.error));
      }

      showToast('🧹 Sistema 100% zerado e pronto para novos cadastros!', 'success');
    } catch (e) {
      console.error('Error clearing all database data:', e);
    }
  };

  // -------------------------------------------------------------
  // Cart Actions
  // -------------------------------------------------------------
  const addToCart = (product: Product, selectedSize: string | number, selectedColor: string, quantity = 1) => {
    const cartItemId = `${product.id}-${selectedColor}-${selectedSize}`;
    setCart(prev => {
      const existing = prev.find(item => item.id === cartItemId);
      let updated: CartItem[];
      if (existing) {
        updated = prev.map(item =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        updated = [...prev, { id: cartItemId, product, selectedSize, selectedColor, quantity }];
      }
      saveToLocalStorage(STORAGE_KEYS.CART, updated);
      return updated;
    });
    setIsCartOpen(true);
    showToast(`Item adicionado à cotação!`);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => {
      const updated = prev.filter(item => item.id !== cartItemId);
      saveToLocalStorage(STORAGE_KEYS.CART, updated);
      return updated;
    });
    showToast('Item removido da cotação.', 'info');
  };

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => {
      const updated = prev
        .map(item => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
      saveToLocalStorage(STORAGE_KEYS.CART, updated);
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    saveToLocalStorage(STORAGE_KEYS.CART, []);
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
        isLoaded,
        isCloudConnected,
        cloudError,
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
        clearAllDataFromDatabase,
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

export default useStore;
