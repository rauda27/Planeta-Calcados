'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  Product,
  Bill,
  CartItem,
  BillStatus,
  Sale,
  SaleStatus,
  SaleItem,
  StoreBanners,
  Customer,
  Supplier,
  PromissoryContract,
  PromissoryInstallment,
} from '../types';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { LEGACY_CUSTOMERS, LEGACY_PROMISSORY_CONTRACTS } from '../lib/legacyDebtorsData';
import { LEGACY_SUPPLIERS } from '../lib/legacySuppliersData';

export const DEFAULT_BANNERS: StoreBanners = {
  heroBannerImage: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1000&q=80',
  femBannerImage: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80',
  tenisBannerImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
  mascBannerImage: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=800&q=80',
  acessoriosBannerImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
};

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
  banners: StoreBanners;
  customers: Customer[];
  suppliers: Supplier[];
  promissoryContracts: PromissoryContract[];
  isCartOpen: boolean;
  toasts: ToastState[];
  isLoaded: boolean;
  isCloudConnected: boolean;
  cloudError: string | null;
  
  // Banner actions
  updateBanners: (newBanners: Partial<StoreBanners>) => Promise<void>;
  resetBannersToDefault: () => Promise<void>;
  
  // Product actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateVariantStock: (productId: string, variantId: string, newStock: number) => void;
  
  // Bill actions
  addBill: (bill: Omit<Bill, 'id' | 'createdAt'>) => void;
  updateBillStatus: (billId: string, status: BillStatus) => void;
  deleteBill: (billId: string) => void;

  // Customer actions
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Customer;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Supplier actions
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => Supplier;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // Promissory Contracts / Debtors actions
  addPromissoryContract: (contract: Omit<PromissoryContract, 'id' | 'createdAt' | 'updatedAt'>) => PromissoryContract;
  updatePromissoryContract: (id: string, contract: Partial<PromissoryContract>) => void;
  payPromissoryInstallment: (
    contractId: string,
    installmentId: string,
    paidAmount: number,
    paidDate?: string,
    receivingLocation?: string
  ) => void;
  payEntirePromissoryContract: (contractId: string, receivingLocation?: string) => void;
  deletePromissoryContract: (contractId: string) => void;
  
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
  BANNERS: 'planeta_banners',
  CUSTOMERS: 'planeta_customers',
  SUPPLIERS: 'planeta_suppliers',
  PROMISSORIES: 'planeta_promissories',
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [promissoryContracts, setPromissoryContracts] = useState<PromissoryContract[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [banners, setBanners] = useState<StoreBanners>(DEFAULT_BANNERS);
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
        const savedBanners = localStorage.getItem(STORAGE_KEYS.BANNERS);
        const savedCustomers = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
        const savedSuppliers = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
        const savedPromissories = localStorage.getItem(STORAGE_KEYS.PROMISSORIES);

        if (savedProducts) setProducts(JSON.parse(savedProducts));
        if (savedBills) setBills(JSON.parse(savedBills));
        if (savedSales) setSales(JSON.parse(savedSales));
        if (savedCart) setCart(JSON.parse(savedCart));
        if (savedBanners) setBanners({ ...DEFAULT_BANNERS, ...JSON.parse(savedBanners) });

        // Suppliers Cache & Seed from Legacy System
        let initialSuppliers: Supplier[] = LEGACY_SUPPLIERS;
        if (savedSuppliers) {
          try {
            const parsed = JSON.parse(savedSuppliers);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const existingIds = new Set(parsed.map((s: Supplier) => s.id || s.cnpjCpf));
              const missingLegacy = LEGACY_SUPPLIERS.filter(l => !existingIds.has(l.id) && !existingIds.has(l.cnpjCpf));
              initialSuppliers = [...parsed, ...missingLegacy];
            }
          } catch {}
        }
        setSuppliers(initialSuppliers);
        saveToLocalStorage(STORAGE_KEYS.SUPPLIERS, initialSuppliers);

        // Customers Cache & Seed from Legacy System
        let initialCustomers: Customer[] = LEGACY_CUSTOMERS;
        if (savedCustomers) {
          try {
            const parsed = JSON.parse(savedCustomers);
            if (Array.isArray(parsed) && parsed.length > 0) {
              initialCustomers = parsed;
            }
          } catch {}
        }
        setCustomers(initialCustomers);
        saveToLocalStorage(STORAGE_KEYS.CUSTOMERS, initialCustomers);

        // Promissory Contracts Cache & Seed from Legacy System
        let initialPromissories: PromissoryContract[] = LEGACY_PROMISSORY_CONTRACTS;
        if (savedPromissories) {
          try {
            const parsed = JSON.parse(savedPromissories);
            if (Array.isArray(parsed) && parsed.length > 0) {
              initialPromissories = parsed;
            }
          } catch {}
        }
        setPromissoryContracts(initialPromissories);
        saveToLocalStorage(STORAGE_KEYS.PROMISSORIES, initialPromissories);
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

      // Sync Customers
      const unsubCustomers = onSnapshot(
        collection(db, 'customers'),
        snapshot => {
          const cloudCustomers: Customer[] = [];
          snapshot.forEach(docSnap => {
            cloudCustomers.push(docSnap.data() as Customer);
          });

          if (cloudCustomers.length === 0) {
            setCustomers(LEGACY_CUSTOMERS);
            saveToLocalStorage(STORAGE_KEYS.CUSTOMERS, LEGACY_CUSTOMERS);
            LEGACY_CUSTOMERS.forEach(cust => {
              setDoc(doc(db, 'customers', cust.id), sanitizeForFirestore(cust)).catch(console.error);
            });
          } else {
            cloudCustomers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setCustomers(cloudCustomers);
            saveToLocalStorage(STORAGE_KEYS.CUSTOMERS, cloudCustomers);
          }
        },
        error => {
          console.error('🔥 Firestore Customers error:', error);
        }
      );

      // Sync Suppliers
      const unsubSuppliers = onSnapshot(
        collection(db, 'suppliers'),
        snapshot => {
          const cloudSuppliers: Supplier[] = [];
          snapshot.forEach(docSnap => {
            cloudSuppliers.push(docSnap.data() as Supplier);
          });

          if (cloudSuppliers.length === 0) {
            setSuppliers(LEGACY_SUPPLIERS);
            saveToLocalStorage(STORAGE_KEYS.SUPPLIERS, LEGACY_SUPPLIERS);
            LEGACY_SUPPLIERS.forEach(sup => {
              setDoc(doc(db, 'suppliers', sup.id), sanitizeForFirestore(sup)).catch(console.error);
            });
          } else {
            // Check if any legacy suppliers are missing in cloud, and upload them
            const existingIds = new Set(cloudSuppliers.map(s => s.id || s.cnpjCpf));
            const missingLegacy = LEGACY_SUPPLIERS.filter(l => !existingIds.has(l.id) && !existingIds.has(l.cnpjCpf));
            if (missingLegacy.length > 0) {
              missingLegacy.forEach(sup => {
                setDoc(doc(db, 'suppliers', sup.id), sanitizeForFirestore(sup)).catch(console.error);
              });
            }
            cloudSuppliers.sort((a, b) => (a.tradeName || '').localeCompare(b.tradeName || ''));
            setSuppliers(cloudSuppliers);
            saveToLocalStorage(STORAGE_KEYS.SUPPLIERS, cloudSuppliers);
          }
        },
        error => {
          console.error('🔥 Firestore Suppliers error:', error);
        }
      );

      // Sync Promissory Contracts
      const unsubPromissories = onSnapshot(
        collection(db, 'promissories'),
        snapshot => {
          const cloudPromissories: PromissoryContract[] = [];
          snapshot.forEach(docSnap => {
            cloudPromissories.push(docSnap.data() as PromissoryContract);
          });

          if (cloudPromissories.length === 0) {
            setPromissoryContracts(LEGACY_PROMISSORY_CONTRACTS);
            saveToLocalStorage(STORAGE_KEYS.PROMISSORIES, LEGACY_PROMISSORY_CONTRACTS);
            LEGACY_PROMISSORY_CONTRACTS.forEach(contract => {
              setDoc(doc(db, 'promissories', contract.id), sanitizeForFirestore(contract)).catch(console.error);
            });
          } else {
            cloudPromissories.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            setPromissoryContracts(cloudPromissories);
            saveToLocalStorage(STORAGE_KEYS.PROMISSORIES, cloudPromissories);
          }
        },
        error => {
          console.error('🔥 Firestore Promissories error:', error);
        }
      );

      // Sync Banners & Settings
      const unsubBanners = onSnapshot(
        doc(db, 'store_settings', 'banners'),
        docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data() as StoreBanners;
            setBanners({ ...DEFAULT_BANNERS, ...data });
            saveToLocalStorage(STORAGE_KEYS.BANNERS, data);
          }
        },
        error => {
          console.error('🔥 Firestore Banners error:', error);
        }
      );

      return () => {
        unsubProducts();
        unsubSales();
        unsubBills();
        unsubCustomers();
        unsubSuppliers();
        unsubPromissories();
        unsubBanners();
      };
    } catch (err: any) {
      console.error('Firebase connection setup failed:', err);
      setIsCloudConnected(false);
      setCloudError(err?.message || 'Erro ao conectar ao Firebase');
    }
  }, []);

  // -------------------------------------------------------------
  // Product Actions
  // -------------------------------------------------------------
  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };

    setProducts(prev => {
      const updated = [newProduct, ...prev];
      saveToLocalStorage(STORAGE_KEYS.PRODUCTS, updated);
      return updated;
    });

    if (db && isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'products', newProduct.id), sanitizeForFirestore(newProduct));
        setIsCloudConnected(true);
      } catch (err: any) {
        console.error('🔥 Error saving product to Firebase:', err);
      }
    }

    showToast(`Produto "${newProduct.name}" cadastrado com sucesso!`, 'success');
  };

  const updateProduct = async (id: string, updatedFields: Partial<Product>) => {
    const now = new Date().toISOString();
    let updatedItem: Product | null = null;

    setProducts(prev => {
      const updated = prev.map(p => {
        if (p.id === id) {
          updatedItem = { ...p, ...updatedFields, updatedAt: now };
          return updatedItem;
        }
        return p;
      });
      saveToLocalStorage(STORAGE_KEYS.PRODUCTS, updated);
      return updated;
    });

    if (db && isFirebaseConfigured && updatedItem) {
      try {
        await setDoc(doc(db, 'products', id), sanitizeForFirestore(updatedItem));
      } catch (err: any) {
        console.error('🔥 Error updating product in Firebase:', err);
      }
    }

    showToast('Produto atualizado com sucesso!', 'success');
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

    showToast('Produto removido do estoque.', 'info');
  };

  const updateVariantStock = async (productId: string, variantId: string, newStock: number) => {
    let updatedProduct: Product | null = null;

    setProducts(prev => {
      const updated = prev.map(p => {
        if (p.id === productId) {
          const variants = p.variants.map(v => (v.id === variantId ? { ...v, stock: newStock } : v));
          updatedProduct = { ...p, variants, updatedAt: new Date().toISOString() };
          return updatedProduct;
        }
        return p;
      });
      saveToLocalStorage(STORAGE_KEYS.PRODUCTS, updated);
      return updated;
    });

    if (db && isFirebaseConfigured && updatedProduct) {
      try {
        await setDoc(doc(db, 'products', productId), sanitizeForFirestore(updatedProduct));
      } catch (err) {
        console.error('Error updating variant stock in Firebase:', err);
      }
    }
  };

  // -------------------------------------------------------------
  // Customer Actions
  // -------------------------------------------------------------
  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer => {
    const now = new Date().toISOString();
    const newCustomer: Customer = {
      ...customerData,
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };

    setCustomers(prev => {
      const updated = [newCustomer, ...prev];
      saveToLocalStorage(STORAGE_KEYS.CUSTOMERS, updated);
      return updated;
    });

    if (db && isFirebaseConfigured) {
      setDoc(doc(db, 'customers', newCustomer.id), sanitizeForFirestore(newCustomer)).catch(console.error);
    }

    showToast(`Cliente "${newCustomer.name}" cadastrado com sucesso!`, 'success');
    return newCustomer;
  };

  const updateCustomer = (id: string, updatedFields: Partial<Customer>) => {
    const now = new Date().toISOString();
    let updatedItem: Customer | null = null;

    setCustomers(prev => {
      const updated = prev.map(c => {
        if (c.id === id) {
          updatedItem = { ...c, ...updatedFields, updatedAt: now };
          return updatedItem;
        }
        return c;
      });
      saveToLocalStorage(STORAGE_KEYS.CUSTOMERS, updated);
      return updated;
    });

    if (db && isFirebaseConfigured && updatedItem) {
      setDoc(doc(db, 'customers', id), sanitizeForFirestore(updatedItem)).catch(console.error);
    }

    showToast('Dados do cliente atualizados com sucesso!', 'success');
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveToLocalStorage(STORAGE_KEYS.CUSTOMERS, updated);
      return updated;
    });

    if (db && isFirebaseConfigured) {
      deleteDoc(doc(db, 'customers', id)).catch(console.error);
    }

    showToast('Cliente removido.', 'info');
  };

  // -------------------------------------------------------------
  // Supplier Actions
  // -------------------------------------------------------------
  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Supplier => {
    const now = new Date().toISOString();
    const newSupplier: Supplier = {
      ...supplierData,
      id: `supp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };

    setSuppliers(prev => {
      const updated = [newSupplier, ...prev];
      saveToLocalStorage(STORAGE_KEYS.SUPPLIERS, updated);
      return updated;
    });

    if (db && isFirebaseConfigured) {
      setDoc(doc(db, 'suppliers', newSupplier.id), sanitizeForFirestore(newSupplier)).catch(console.error);
    }

    showToast(`Fornecedor "${newSupplier.tradeName}" cadastrado com sucesso!`, 'success');
    return newSupplier;
  };

  const updateSupplier = (id: string, updatedFields: Partial<Supplier>) => {
    const now = new Date().toISOString();
    let updatedItem: Supplier | null = null;

    setSuppliers(prev => {
      const updated = prev.map(s => {
        if (s.id === id) {
          updatedItem = { ...s, ...updatedFields, updatedAt: now };
          return updatedItem;
        }
        return s;
      });
      saveToLocalStorage(STORAGE_KEYS.SUPPLIERS, updated);
      return updated;
    });

    if (db && isFirebaseConfigured && updatedItem) {
      setDoc(doc(db, 'suppliers', id), sanitizeForFirestore(updatedItem)).catch(console.error);
    }

    showToast('Fornecedor atualizado com sucesso!', 'success');
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveToLocalStorage(STORAGE_KEYS.SUPPLIERS, updated);
      return updated;
    });

    if (db && isFirebaseConfigured) {
      deleteDoc(doc(db, 'suppliers', id)).catch(console.error);
    }

    showToast('Fornecedor removido.', 'info');
  };

  // -------------------------------------------------------------
  // Promissory Contracts / Debtors Actions
  // -------------------------------------------------------------
  const addPromissoryContract = (
    contractData: Omit<PromissoryContract, 'id' | 'createdAt' | 'updatedAt'>
  ): PromissoryContract => {
    const now = new Date().toISOString();
    const newContract: PromissoryContract = {
      ...contractData,
      id: `prom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };

    setPromissoryContracts(prev => {
      const updated = [newContract, ...prev];
      saveToLocalStorage(STORAGE_KEYS.PROMISSORIES, updated);
      return updated;
    });

    if (db && isFirebaseConfigured) {
      setDoc(doc(db, 'promissories', newContract.id), sanitizeForFirestore(newContract)).catch(console.error);
    }

    return newContract;
  };

  const updatePromissoryContract = (id: string, updatedFields: Partial<PromissoryContract>) => {
    const now = new Date().toISOString();
    let updatedItem: PromissoryContract | null = null;

    setPromissoryContracts(prev => {
      const updated = prev.map(c => {
        if (c.id === id) {
          updatedItem = { ...c, ...updatedFields, updatedAt: now };
          return updatedItem;
        }
        return c;
      });
      saveToLocalStorage(STORAGE_KEYS.PROMISSORIES, updated);
      return updated;
    });

    if (db && isFirebaseConfigured && updatedItem) {
      setDoc(doc(db, 'promissories', id), sanitizeForFirestore(updatedItem)).catch(console.error);
    }
  };

  const payPromissoryInstallment = (
    contractId: string,
    installmentId: string,
    paidAmount: number,
    paidDate?: string,
    receivingLocation = 'Balcão Quatro Barras'
  ) => {
    const now = new Date().toISOString();
    const payDate = paidDate || now;
    let updatedContract: PromissoryContract | null = null;

    setPromissoryContracts(prev => {
      const updated = prev.map(contract => {
        if (contract.id === contractId) {
          const updatedInstallments = contract.installments.map(inst => {
            if (inst.id === installmentId) {
              return {
                ...inst,
                status: 'paid' as const,
                paidDate: payDate,
                paidAmount: paidAmount,
                receivingLocation,
              };
            }
            return inst;
          });

          const totalPaid = updatedInstallments.reduce(
            (sum, i) => sum + (i.status === 'paid' ? i.paidAmount || i.amount : 0),
            0
          );
          const totalUnpaid = Math.max(0, contract.totalSaleAmount - totalPaid);
          const allPaid = updatedInstallments.every(i => i.status === 'paid');

          updatedContract = {
            ...contract,
            installments: updatedInstallments,
            totalPaidAmount: totalPaid,
            totalUnpaidAmount: totalUnpaid,
            status: allPaid ? 'paid' : totalPaid > 0 ? 'partial' : contract.status,
            updatedAt: now,
          };
          return updatedContract;
        }
        return contract;
      });
      saveToLocalStorage(STORAGE_KEYS.PROMISSORIES, updated);
      return updated;
    });

    if (db && isFirebaseConfigured && updatedContract) {
      setDoc(doc(db, 'promissories', contractId), sanitizeForFirestore(updatedContract)).catch(console.error);
    }

    showToast('Baixa de parcela registrada com sucesso!', 'success');
  };

  const payEntirePromissoryContract = (contractId: string, receivingLocation = 'Balcão Quatro Barras') => {
    const now = new Date().toISOString();
    let updatedContract: PromissoryContract | null = null;

    setPromissoryContracts(prev => {
      const updated = prev.map(contract => {
        if (contract.id === contractId) {
          const updatedInstallments = contract.installments.map(inst => ({
            ...inst,
            status: 'paid' as const,
            paidDate: inst.paidDate || now,
            paidAmount: inst.paidAmount || inst.amount,
            receivingLocation: inst.receivingLocation || receivingLocation,
          }));

          updatedContract = {
            ...contract,
            installments: updatedInstallments,
            totalPaidAmount: contract.totalSaleAmount,
            totalUnpaidAmount: 0,
            status: 'paid',
            updatedAt: now,
          };
          return updatedContract;
        }
        return contract;
      });
      saveToLocalStorage(STORAGE_KEYS.PROMISSORIES, updated);
      return updated;
    });

    if (db && isFirebaseConfigured && updatedContract) {
      setDoc(doc(db, 'promissories', contractId), sanitizeForFirestore(updatedContract)).catch(console.error);
    }

    showToast('Contrato baixado integralmente com sucesso!', 'success');
  };

  const deletePromissoryContract = (contractId: string) => {
    const contractToDelete = promissoryContracts.find(c => c.id === contractId);
    if (!contractToDelete) return;

    // 1. Cascade Delete linked Sale (Venda) & Revert Stock
    const linkedSale = sales.find(
      s => s.id === contractToDelete.saleId || (contractToDelete.saleCode && s.code === contractToDelete.saleCode)
    );

    if (linkedSale) {
      if (linkedSale.status !== 'cancelled') {
        const updatedProducts = products.map(product => {
          let modified = false;
          const updatedVariants = product.variants.map(variant => {
            const soldItem = linkedSale.items.find(
              i => i.productId === product.id && i.variantId === variant.id
            );
            if (soldItem) {
              modified = true;
              return { ...variant, stock: variant.stock + soldItem.quantity };
            }
            return variant;
          });
          if (modified) {
            return { ...product, variants: updatedVariants, updatedAt: new Date().toISOString() };
          }
          return product;
        });

        setProducts(updatedProducts);
        saveToLocalStorage(STORAGE_KEYS.PRODUCTS, updatedProducts);

        if (db && isFirebaseConfigured) {
          updatedProducts.forEach(p => {
            setDoc(doc(db, 'products', p.id), sanitizeForFirestore(p)).catch(console.error);
          });
        }
      }

      setSales(prev => {
        const updated = prev.filter(s => s.id !== linkedSale.id);
        saveToLocalStorage(STORAGE_KEYS.SALES, updated);
        return updated;
      });

      if (db && isFirebaseConfigured) {
        deleteDoc(doc(db, 'sales', linkedSale.id)).catch(console.error);
      }
    }

    // 2. Delete Promissory Contract
    setPromissoryContracts(prev => {
      const updated = prev.filter(c => c.id !== contractId);
      saveToLocalStorage(STORAGE_KEYS.PROMISSORIES, updated);
      return updated;
    });

    if (db && isFirebaseConfigured) {
      deleteDoc(doc(db, 'promissories', contractId)).catch(console.error);
    }

    showToast(`Contrato ${contractToDelete.contractNumber} e venda vinculada removidos com sucesso.`, 'info');
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
      } catch (err) {
        console.error('Error saving bill to Firebase:', err);
      }
    }

    showToast('Conta a pagar cadastrada com sucesso!', 'success');
  };

  const updateBillStatus = async (billId: string, status: BillStatus) => {
    let updatedBill: Bill | null = null;

    setBills(prev => {
      const updated = prev.map(b => {
        if (b.id === billId) {
          updatedBill = { ...b, status };
          return updatedBill;
        }
        return b;
      });
      saveToLocalStorage(STORAGE_KEYS.BILLS, updated);
      return updated;
    });

    if (db && isFirebaseConfigured && updatedBill) {
      try {
        await setDoc(doc(db, 'bills', billId), sanitizeForFirestore(updatedBill));
      } catch (err) {
        console.error('Error updating bill in Firebase:', err);
      }
    }

    showToast(`Status da conta atualizado para "${status}"!`);
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
      } catch (err) {
        console.error('Error deleting bill in Firebase:', err);
      }
    }

    showToast('Conta removida com sucesso.', 'info');
  };

  // -------------------------------------------------------------
  // Sales & POS Actions
  // -------------------------------------------------------------
  const addSale = (saleData: Omit<Sale, 'id' | 'code' | 'createdAt'>): Sale => {
    const now = new Date().toISOString();
    const nextSeq = sales.length + 1042;
    const saleCode = `VENDA-${nextSeq}`;
    const saleId = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newSale: Sale = {
      ...saleData,
      id: saleId,
      code: saleCode,
      createdAt: now,
    };

    // Deduct stock for all items sold in POS
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

    // Auto-create PromissoryContract if paymentMethod is promissory_note
    if (newSale.paymentMethod === 'promissory_note') {
      const promDetails = newSale.paymentDetails?.promissory;
      const numInstallments = promDetails?.installments || 1;
      const contractCode =
        promDetails?.contractNumber ||
        `CTR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Build installments array if not provided
      let installments: PromissoryInstallment[] = promDetails?.installmentDetails || [];
      if (installments.length === 0) {
        const installmentValue = Number((newSale.total / numInstallments).toFixed(2));
        const baseDate = new Date();

        for (let i = 1; i <= numInstallments; i++) {
          const dueDate = new Date(baseDate);
          dueDate.setDate(dueDate.getDate() + 30 * i);
          const docNum = `50${Math.floor(100000 + Math.random() * 900000)}`;

          installments.push({
            id: `inst_${Date.now()}_${i}`,
            documentNumber: docNum,
            installmentNumber: i,
            totalInstallments: numInstallments,
            issueDate: now.split('T')[0],
            dueDate: promDetails?.dueDate && i === 1 ? promDetails.dueDate : dueDate.toISOString().split('T')[0],
            amount: i === numInstallments ? Number((newSale.total - installmentValue * (numInstallments - 1)).toFixed(2)) : installmentValue,
            status: 'pending',
          });
        }
      }

      const newContract: PromissoryContract = {
        id: `prom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        contractNumber: contractCode,
        saleId: newSale.id,
        saleCode: newSale.code,
        customerId: newSale.customer?.id,
        customerName: newSale.customer?.name || promDetails?.customerName || 'Cliente Balcão',
        customerCpfCnpj: newSale.customer?.cpf || promDetails?.customerCpf || '',
        customerPhone: newSale.customer?.phone || promDetails?.customerPhone || '',
        customerMobile: newSale.customer?.phone || promDetails?.customerPhone || '',
        totalSaleAmount: newSale.total,
        totalPaidAmount: 0,
        totalUnpaidAmount: newSale.total,
        installments,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };

      setPromissoryContracts(prev => {
        const updated = [newContract, ...prev];
        saveToLocalStorage(STORAGE_KEYS.PROMISSORIES, updated);
        return updated;
      });

      if (db && isFirebaseConfigured) {
        setDoc(doc(db, 'promissories', newContract.id), sanitizeForFirestore(newContract)).catch(console.error);
      }
    }

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

          const diff = newQty - oldQty;

          if (diff !== 0) {
            modified = true;
            const finalStock = Math.max(0, variant.stock - diff);
            return { ...variant, stock: finalStock };
          }
          return variant;
        });

        if (modified) {
          return { ...product, variants: updatedVariants, updatedAt: new Date().toISOString() };
        }
        return product;
      });

      setProducts(updatedProducts);
      saveToLocalStorage(STORAGE_KEYS.PRODUCTS, updatedProducts);
    }

    const updatedSale: Sale = {
      ...originalSale,
      ...updatedFields,
      items: itemsToSave,
    };

    setSales(prev => {
      const updated = prev.map(s => (s.id === saleId ? updatedSale : s));
      saveToLocalStorage(STORAGE_KEYS.SALES, updated);
      return updated;
    });

    if (db && isFirebaseConfigured) {
      setDoc(doc(db, 'sales', saleId), sanitizeForFirestore(updatedSale)).catch(console.error);
      if (newItems) {
        updatedProducts.forEach(p => {
          setDoc(doc(db, 'products', p.id), sanitizeForFirestore(p)).catch(console.error);
        });
      }
    }

    showToast(`Venda ${originalSale.code} atualizada com sucesso!`, 'success');
  };

  const deleteSale = (saleId: string) => {
    const saleToDelete = sales.find(s => s.id === saleId);
    if (!saleToDelete) return;

    // Revert stock if sale was active
    if (saleToDelete.status !== 'cancelled') {
      const updatedProducts = products.map(product => {
        let modified = false;
        const updatedVariants = product.variants.map(variant => {
          const soldItem = saleToDelete.items.find(
            i => i.productId === product.id && i.variantId === variant.id
          );
          if (soldItem) {
            modified = true;
            return { ...variant, stock: variant.stock + soldItem.quantity };
          }
          return variant;
        });
        if (modified) {
          return { ...product, variants: updatedVariants, updatedAt: new Date().toISOString() };
        }
        return product;
      });

      setProducts(updatedProducts);
      saveToLocalStorage(STORAGE_KEYS.PRODUCTS, updatedProducts);

      if (db && isFirebaseConfigured) {
        updatedProducts.forEach(p => {
          setDoc(doc(db, 'products', p.id), sanitizeForFirestore(p)).catch(console.error);
        });
      }
    }

    // 2. Cascade Delete linked Promissory Contract (Crediário)
    const linkedContract = promissoryContracts.find(
      c => c.saleId === saleId || (saleToDelete.code && c.saleCode === saleToDelete.code)
    );

    if (linkedContract) {
      setPromissoryContracts(prev => {
        const updated = prev.filter(c => c.id !== linkedContract.id);
        saveToLocalStorage(STORAGE_KEYS.PROMISSORIES, updated);
        return updated;
      });

      if (db && isFirebaseConfigured) {
        deleteDoc(doc(db, 'promissories', linkedContract.id)).catch(console.error);
      }
    }

    // 3. Delete Sale
    setSales(prev => {
      const updated = prev.filter(s => s.id !== saleId);
      saveToLocalStorage(STORAGE_KEYS.SALES, updated);
      return updated;
    });

    if (db && isFirebaseConfigured) {
      deleteDoc(doc(db, 'sales', saleId)).catch(console.error);
    }

    showToast(`Venda ${saleToDelete.code} e crediário vinculado excluídos com sucesso.`, 'info');
  };

  const markPromissoryAsPaid = (saleId: string) => {
    const now = new Date().toISOString();
    let updatedSale: Sale | null = null;

    setSales(prev => {
      const updated = prev.map(s => {
        if (s.id === saleId) {
          updatedSale = {
            ...s,
            status: 'completed' as SaleStatus,
            paymentDetails: {
              ...s.paymentDetails,
              promissory: s.paymentDetails?.promissory
                ? { ...s.paymentDetails.promissory, isPaid: true, paidAt: now }
                : undefined,
            },
          };
          return updatedSale;
        }
        return s;
      });
      saveToLocalStorage(STORAGE_KEYS.SALES, updated);
      return updated;
    });

    // Also update any matching promissory contracts
    const contract = promissoryContracts.find(c => c.saleId === saleId);
    if (contract) {
      payEntirePromissoryContract(contract.id);
    }

    if (db && isFirebaseConfigured && updatedSale) {
      setDoc(doc(db, 'sales', saleId), sanitizeForFirestore(updatedSale)).catch(console.error);
    }

    showToast('Nota promissória liquidada com sucesso!', 'success');
  };

  const cancelSale = (saleId: string) => {
    const originalSale = sales.find(s => s.id === saleId);
    if (!originalSale || originalSale.status === 'cancelled') return;

    // Return items to inventory
    const updatedProducts = products.map(product => {
      let modified = false;
      const updatedVariants = product.variants.map(variant => {
        const soldItem = originalSale.items.find(
          i => i.productId === product.id && i.variantId === variant.id
        );
        if (soldItem) {
          modified = true;
          return { ...variant, stock: variant.stock + soldItem.quantity };
        }
        return variant;
      });

      if (modified) {
        return { ...product, variants: updatedVariants, updatedAt: new Date().toISOString() };
      }
      return product;
    });

    setProducts(updatedProducts);
    saveToLocalStorage(STORAGE_KEYS.PRODUCTS, updatedProducts);

    const updatedSale: Sale = {
      ...originalSale,
      status: 'cancelled',
    };

    setSales(prev => {
      const updated = prev.map(s => (s.id === saleId ? updatedSale : s));
      saveToLocalStorage(STORAGE_KEYS.SALES, updated);
      return updated;
    });

    if (db && isFirebaseConfigured) {
      setDoc(doc(db, 'sales', saleId), sanitizeForFirestore(updatedSale)).catch(console.error);
      updatedProducts.forEach(p => {
        setDoc(doc(db, 'products', p.id), sanitizeForFirestore(p)).catch(console.error);
      });
    }

    showToast(`Venda ${originalSale.code} cancelada e itens devolvidos ao estoque.`, 'warning');
  };

  const clearERPTransactionsForDelivery = () => {
    try {
      const salesToDel = [...sales];
      const billsToDel = [...bills];
      const promToDel = [...promissoryContracts];

      setSales([]);
      setBills([]);
      setPromissoryContracts([]);

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.PROMISSORIES, JSON.stringify([]));
      }

      if (db && isFirebaseConfigured) {
        salesToDel.forEach(s => deleteDoc(doc(db, 'sales', s.id)).catch(console.error));
        billsToDel.forEach(b => deleteDoc(doc(db, 'bills', b.id)).catch(console.error));
        promToDel.forEach(p => deleteDoc(doc(db, 'promissories', p.id)).catch(console.error));
      }

      showToast('🧹 Caixa e vendas zerados com sucesso!', 'success');
    } catch (e) {
      console.error('Error clearing ERP transactions:', e);
    }
  };

  const clearAllDataFromDatabase = () => {
    try {
      const prodsToDel = [...products];
      const salesToDel = [...sales];
      const billsToDel = [...bills];
      const custToDel = [...customers];
      const suppToDel = [...suppliers];
      const promToDel = [...promissoryContracts];

      setProducts([]);
      setSales([]);
      setBills([]);
      setCustomers([]);
      setSuppliers([]);
      setPromissoryContracts([]);
      setCart([]);

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.PROMISSORIES, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
      }

      if (db && isFirebaseConfigured) {
        prodsToDel.forEach(p => deleteDoc(doc(db, 'products', p.id)).catch(console.error));
        salesToDel.forEach(s => deleteDoc(doc(db, 'sales', s.id)).catch(console.error));
        billsToDel.forEach(b => deleteDoc(doc(db, 'bills', b.id)).catch(console.error));
        custToDel.forEach(c => deleteDoc(doc(db, 'customers', c.id)).catch(console.error));
        suppToDel.forEach(s => deleteDoc(doc(db, 'suppliers', s.id)).catch(console.error));
        promToDel.forEach(p => deleteDoc(doc(db, 'promissories', p.id)).catch(console.error));
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

  // -------------------------------------------------------------
  // Banner & Store Customization Actions
  // -------------------------------------------------------------
  const updateBanners = async (newBanners: Partial<StoreBanners>) => {
    const updated: StoreBanners = { ...banners, ...newBanners };
    setBanners(updated);
    saveToLocalStorage(STORAGE_KEYS.BANNERS, updated);

    if (db && isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'store_settings', 'banners'), sanitizeForFirestore(updated));
        setIsCloudConnected(true);
      } catch (err: any) {
        console.error('🔥 Error saving banners to Firebase:', err);
      }
    }
    showToast('Imagens e Banners da loja atualizados com sucesso!', 'success');
  };

  const resetBannersToDefault = async () => {
    setBanners(DEFAULT_BANNERS);
    saveToLocalStorage(STORAGE_KEYS.BANNERS, DEFAULT_BANNERS);

    if (db && isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'store_settings', 'banners'), sanitizeForFirestore(DEFAULT_BANNERS));
      } catch (err) {
        console.error('Error resetting banners on Firebase:', err);
      }
    }
    showToast('Banners restaurados para o padrão original.', 'info');
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        bills,
        sales,
        customers,
        suppliers,
        promissoryContracts,
        cart,
        banners,
        isCartOpen,
        toasts,
        isLoaded,
        isCloudConnected,
        cloudError,
        updateBanners,
        resetBannersToDefault,
        addProduct,
        updateProduct,
        deleteProduct,
        updateVariantStock,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addPromissoryContract,
        updatePromissoryContract,
        payPromissoryInstallment,
        payEntirePromissoryContract,
        deletePromissoryContract,
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
