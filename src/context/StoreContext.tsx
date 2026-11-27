'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
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
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { LEGACY_CUSTOMERS, LEGACY_PROMISSORY_CONTRACTS } from '../lib/legacyDebtorsData';
import { LEGACY_SUPPLIERS } from '../lib/legacySuppliersData';
import { LEGACY_PRODUCTS_766 } from '../lib/legacyProductsData';
import { normalizeBrand } from '../lib/brandUtils';
import { toLocalDateStr } from '../lib/dateUtils';

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
  SEED_VERSIONS: 'planeta_seed_versions',
};

// Versao da carga de dados legados (produtos/clientes/fornecedores/crediario do sistema antigo).
// Os dados legados sao enviados UMA vez por versao. Assim, itens excluidos pelo usuario nao
// "ressuscitam" e o botao de zerar o sistema realmente zera. Ao ampliar as listas legadas,
// incremente este numero para que os novos itens sejam importados uma unica vez.
const LEGACY_SEED_VERSION = 2;
type SeedKey = 'products' | 'customers' | 'suppliers' | 'promissories';
type SeedVersions = Partial<Record<SeedKey, number>>;

const readLocalSeedVersions = (): SeedVersions => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.SEED_VERSIONS) : null;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const parseArray = <T,>(raw: string | null): T[] | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

// Clientes migrados gravaram status 'ativo' (pt-BR), que a tela exibia como "Bloqueado"
const normalizeCustomer = (c: Customer): Customer => {
  const raw = String(c.status || '').toLowerCase();
  const status: Customer['status'] = raw === 'blocked' || raw === 'bloqueado' ? 'blocked' : 'active';
  return c.status === status ? c : { ...c, status };
};

const extractSaleNumber = (code?: string): number => {
  const match = /(\d+)\s*$/.exec(code || '');
  return match ? Number(match[1]) : 0;
};

/**
 * Aplica uma movimentacao de estoque (sign = -1 baixa, +1 devolve) e retorna a nova lista
 * junto com SOMENTE os produtos alterados (para gravar apenas eles no Firestore).
 */
const applyStockMovement = (
  list: Product[],
  items: { productId: string; variantId: string; quantity: number }[],
  sign: 1 | -1,
  now: string
): { next: Product[]; changed: Product[] } => {
  const changed: Product[] = [];
  const next = list.map(product => {
    let modified = false;
    const variants = product.variants.map(variant => {
      const qty = items
        .filter(i => i.productId === product.id && i.variantId === variant.id)
        .reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
      if (qty === 0) return variant;
      modified = true;
      return { ...variant, stock: Math.max(0, variant.stock + sign * qty) };
    });
    if (!modified) return product;
    const updated = { ...product, variants, updatedAt: now };
    changed.push(updated);
    return updated;
  });
  return { next, changed };
};

// Safe helper to strip undefined keys so Firestore never rejects data
const sanitizeForFirestore = <T,>(data: T): T => {
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

  // Refs espelham o estado mais recente de forma SINCRONA. As acoes calculam o novo estado a
  // partir delas (e nao de dentro de um updater do setState, que o React pode executar depois),
  // garantindo que o objeto enviado ao Firestore seja sempre o correto e que vendas feitas em
  // sequencia rapida nao usem um estoque desatualizado.
  const productsRef = useRef<Product[]>([]);
  const billsRef = useRef<Bill[]>([]);
  const salesRef = useRef<Sale[]>([]);
  const customersRef = useRef<Customer[]>([]);
  const suppliersRef = useRef<Supplier[]>([]);
  const promissoryRef = useRef<PromissoryContract[]>([]);

  const commitProducts = (next: Product[]) => {
    productsRef.current = next;
    setProducts(next);
    saveToLocalStorage(STORAGE_KEYS.PRODUCTS, next);
  };
  const commitBills = (next: Bill[]) => {
    billsRef.current = next;
    setBills(next);
    saveToLocalStorage(STORAGE_KEYS.BILLS, next);
  };
  const commitSales = (next: Sale[]) => {
    salesRef.current = next;
    setSales(next);
    saveToLocalStorage(STORAGE_KEYS.SALES, next);
  };
  const commitCustomers = (list: Customer[]) => {
    const next = list.map(normalizeCustomer);
    customersRef.current = next;
    setCustomers(next);
    saveToLocalStorage(STORAGE_KEYS.CUSTOMERS, next);
  };
  const commitSuppliers = (next: Supplier[]) => {
    suppliersRef.current = next;
    setSuppliers(next);
    saveToLocalStorage(STORAGE_KEYS.SUPPLIERS, next);
  };
  const commitPromissories = (next: PromissoryContract[]) => {
    promissoryRef.current = next;
    setPromissoryContracts(next);
    saveToLocalStorage(STORAGE_KEYS.PROMISSORIES, next);
  };

  const cloudEnabled = () => Boolean(db && isFirebaseConfigured);
  const cloudSet = (col: string, id: string, data: unknown) => {
    if (!db || !isFirebaseConfigured) return Promise.resolve();
    return setDoc(doc(db, col, id), sanitizeForFirestore(data)).catch(err => {
      console.error(`🔥 Erro ao gravar ${col}/${id} no Firebase:`, err);
      throw err;
    });
  };
  const cloudSetQuiet = (col: string, id: string, data: unknown) => {
    cloudSet(col, id, data).catch(() => undefined);
  };
  const cloudDeleteQuiet = (col: string, id: string) => {
    if (!db || !isFirebaseConfigured) return;
    deleteDoc(doc(db, col, id)).catch(err => console.error(`🔥 Erro ao excluir ${col}/${id} no Firebase:`, err));
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
        const seedVersions = readLocalSeedVersions();
        const needsSeed = (key: SeedKey) => (seedVersions[key] ?? 0) < LEGACY_SEED_VERSION;

        // Products Cache & Seed from Legacy System (766000+)
        const savedProducts = parseArray<Product>(localStorage.getItem(STORAGE_KEYS.PRODUCTS));
        let initialProducts: Product[];
        if (!savedProducts) {
          initialProducts = LEGACY_PRODUCTS_766;
        } else {
          initialProducts = savedProducts.map(p => {
            const normBrand = normalizeBrand(p);
            return p.brand !== normBrand ? { ...p, brand: normBrand } : p;
          });
          if (needsSeed('products')) {
            const existingIds = new Set(initialProducts.map(p => p.id || p.sku));
            const missingLegacy = LEGACY_PRODUCTS_766.filter(l => !existingIds.has(l.id) && !existingIds.has(l.sku));
            initialProducts = [...initialProducts, ...missingLegacy];
          }
        }
        commitProducts(initialProducts);

        commitBills(parseArray<Bill>(localStorage.getItem(STORAGE_KEYS.BILLS)) || []);
        commitSales(parseArray<Sale>(localStorage.getItem(STORAGE_KEYS.SALES)) || []);

        const savedCart = parseArray<CartItem>(localStorage.getItem(STORAGE_KEYS.CART));
        if (savedCart) setCart(savedCart);

        const savedBanners = localStorage.getItem(STORAGE_KEYS.BANNERS);
        if (savedBanners) {
          try {
            setBanners({ ...DEFAULT_BANNERS, ...JSON.parse(savedBanners) });
          } catch {}
        }

        // Suppliers Cache & Seed from Legacy System
        const savedSuppliers = parseArray<Supplier>(localStorage.getItem(STORAGE_KEYS.SUPPLIERS));
        let initialSuppliers: Supplier[];
        if (!savedSuppliers) {
          initialSuppliers = LEGACY_SUPPLIERS;
        } else if (needsSeed('suppliers')) {
          const existingIds = new Set(savedSuppliers.map(s => s.id || s.cnpjCpf));
          const missingLegacy = LEGACY_SUPPLIERS.filter(l => !existingIds.has(l.id) && !existingIds.has(l.cnpjCpf));
          initialSuppliers = [...savedSuppliers, ...missingLegacy];
        } else {
          initialSuppliers = savedSuppliers;
        }
        commitSuppliers(initialSuppliers);

        // Customers Cache & Seed from Legacy System
        const savedCustomers = parseArray<Customer>(localStorage.getItem(STORAGE_KEYS.CUSTOMERS));
        commitCustomers(
          !savedCustomers || (savedCustomers.length === 0 && needsSeed('customers')) ? LEGACY_CUSTOMERS : savedCustomers
        );

        // Promissory Contracts Cache & Seed from Legacy System
        const savedPromissories = parseArray<PromissoryContract>(localStorage.getItem(STORAGE_KEYS.PROMISSORIES));
        commitPromissories(
          !savedPromissories || (savedPromissories.length === 0 && needsSeed('promissories'))
            ? LEGACY_PROMISSORY_CONTRACTS
            : savedPromissories
        );

        saveToLocalStorage(STORAGE_KEYS.SEED_VERSIONS, {
          products: LEGACY_SEED_VERSION,
          customers: LEGACY_SEED_VERSION,
          suppliers: LEGACY_SEED_VERSION,
          promissories: LEGACY_SEED_VERSION,
        });
      }
    } catch (e) {
      console.error('Error loading initial cache:', e);
    } finally {
      setIsLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Real-time Cloud Synchronization with Firebase Firestore
  useEffect(() => {
    const firestore = db;
    if (!firestore || !isFirebaseConfigured) {
      setIsCloudConnected(false);
      return;
    }

    let cancelled = false;
    const unsubscribers: Array<() => void> = [];
    const seedRef = doc(firestore, 'store_settings', 'seed');
    let cloudSeed: SeedVersions = {};

    // Retorna true (uma unica vez por versao) quando os dados legados devem ser enviados
    const claimSeed = (key: SeedKey, fromCache: boolean): boolean => {
      if (fromCache || (cloudSeed[key] ?? 0) >= LEGACY_SEED_VERSION) return false;
      cloudSeed = { ...cloudSeed, [key]: LEGACY_SEED_VERSION };
      setDoc(seedRef, { [key]: LEGACY_SEED_VERSION }, { merge: true }).catch(console.error);
      return true;
    };

    // Enquanto uma colecao nao recebeu dados do SERVIDOR, snapshots vindos so do cache (ex.:
    // internet caiu) chegam vazios e apagariam os dados locais. Nesses casos mantemos o cache local.
    const serverSynced = new Set<string>();
    const isStaleCache = (key: string, fromCache: boolean): boolean => {
      if (!fromCache) {
        serverSynced.add(key);
        return false;
      }
      return !serverSynced.has(key);
    };

    const upload = (col: string, items: { id: string }[]) => {
      items.forEach(item => {
        setDoc(doc(firestore, col, item.id), sanitizeForFirestore(item)).catch(console.error);
      });
    };

    const subscribe = () => {
      if (cancelled) return;
      try {
        // Sync Products
        unsubscribers.push(
          onSnapshot(
            collection(firestore, 'products'),
            snapshot => {
              if (isStaleCache('products', snapshot.metadata.fromCache)) return;
              setIsCloudConnected(true);
              setCloudError(null);
              let cloudProducts: Product[] = [];
              const productsToUpdateInCloud: Product[] = [];

              snapshot.forEach(docSnap => {
                const data = docSnap.data() as Product;
                const normBrand = normalizeBrand(data);
                if (data.brand !== normBrand) {
                  const updatedProduct = { ...data, brand: normBrand };
                  cloudProducts.push(updatedProduct);
                  productsToUpdateInCloud.push(updatedProduct);
                } else {
                  cloudProducts.push(data);
                }
              });

              // Auto repair legacy/composite brand tags in Firebase Firestore
              if (productsToUpdateInCloud.length > 0) upload('products', productsToUpdateInCloud);

              if (claimSeed('products', snapshot.metadata.fromCache)) {
                const existingIds = new Set(cloudProducts.map(p => p.id || p.sku));
                const missingLegacy = LEGACY_PRODUCTS_766.filter(
                  l => !existingIds.has(l.id) && !existingIds.has(l.sku)
                );
                if (missingLegacy.length > 0) {
                  upload('products', missingLegacy);
                  cloudProducts = [...cloudProducts, ...missingLegacy];
                }
              }

              cloudProducts.sort(
                (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
              );
              commitProducts(cloudProducts);
            },
            error => {
              console.error('🔥 Firestore Products error:', error);
              setIsCloudConnected(false);
              setCloudError(error.message);
            }
          )
        );

        // Sync Sales
        unsubscribers.push(
          onSnapshot(
            collection(firestore, 'sales'),
            snapshot => {
              if (isStaleCache('sales', snapshot.metadata.fromCache)) return;
              const cloudSales: Sale[] = [];
              snapshot.forEach(docSnap => {
                cloudSales.push(docSnap.data() as Sale);
              });
              cloudSales.sort(
                (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
              );
              commitSales(cloudSales);
            },
            error => console.error('🔥 Firestore Sales error:', error)
          )
        );

        // Sync Bills
        unsubscribers.push(
          onSnapshot(
            collection(firestore, 'bills'),
            snapshot => {
              if (isStaleCache('bills', snapshot.metadata.fromCache)) return;
              const cloudBills: Bill[] = [];
              snapshot.forEach(docSnap => {
                cloudBills.push(docSnap.data() as Bill);
              });
              cloudBills.sort(
                (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
              );
              commitBills(cloudBills);
            },
            error => console.error('🔥 Firestore Bills error:', error)
          )
        );

        // Sync Customers
        unsubscribers.push(
          onSnapshot(
            collection(firestore, 'customers'),
            snapshot => {
              if (isStaleCache('customers', snapshot.metadata.fromCache)) return;
              let cloudCustomers: Customer[] = [];
              snapshot.forEach(docSnap => {
                cloudCustomers.push(docSnap.data() as Customer);
              });
              if (claimSeed('customers', snapshot.metadata.fromCache) && cloudCustomers.length === 0) {
                upload('customers', LEGACY_CUSTOMERS);
                cloudCustomers = [...LEGACY_CUSTOMERS];
              }
              cloudCustomers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
              commitCustomers(cloudCustomers);
            },
            error => console.error('🔥 Firestore Customers error:', error)
          )
        );

        // Sync Suppliers
        unsubscribers.push(
          onSnapshot(
            collection(firestore, 'suppliers'),
            snapshot => {
              if (isStaleCache('suppliers', snapshot.metadata.fromCache)) return;
              let cloudSuppliers: Supplier[] = [];
              snapshot.forEach(docSnap => {
                cloudSuppliers.push(docSnap.data() as Supplier);
              });
              if (claimSeed('suppliers', snapshot.metadata.fromCache)) {
                const existingIds = new Set(cloudSuppliers.map(s => s.id || s.cnpjCpf));
                const missingLegacy = LEGACY_SUPPLIERS.filter(
                  l => !existingIds.has(l.id) && !existingIds.has(l.cnpjCpf)
                );
                if (missingLegacy.length > 0) {
                  upload('suppliers', missingLegacy);
                  cloudSuppliers = [...cloudSuppliers, ...missingLegacy];
                }
              }
              cloudSuppliers.sort((a, b) => (a.tradeName || '').localeCompare(b.tradeName || ''));
              commitSuppliers(cloudSuppliers);
            },
            error => console.error('🔥 Firestore Suppliers error:', error)
          )
        );

        // Sync Promissory Contracts
        unsubscribers.push(
          onSnapshot(
            collection(firestore, 'promissories'),
            snapshot => {
              if (isStaleCache('promissories', snapshot.metadata.fromCache)) return;
              let cloudPromissories: PromissoryContract[] = [];
              snapshot.forEach(docSnap => {
                cloudPromissories.push(docSnap.data() as PromissoryContract);
              });
              if (claimSeed('promissories', snapshot.metadata.fromCache) && cloudPromissories.length === 0) {
                upload('promissories', LEGACY_PROMISSORY_CONTRACTS);
                cloudPromissories = [...LEGACY_PROMISSORY_CONTRACTS];
              }
              cloudPromissories.sort(
                (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
              );
              commitPromissories(cloudPromissories);
            },
            error => console.error('🔥 Firestore Promissories error:', error)
          )
        );

        // Sync Banners & Settings
        unsubscribers.push(
          onSnapshot(
            doc(firestore, 'store_settings', 'banners'),
            docSnap => {
              if (docSnap.exists()) {
                const data = docSnap.data() as StoreBanners;
                setBanners({ ...DEFAULT_BANNERS, ...data });
                saveToLocalStorage(STORAGE_KEYS.BANNERS, data);
              }
            },
            error => console.error('🔥 Firestore Banners error:', error)
          )
        );
      } catch (err: any) {
        console.error('Firebase connection setup failed:', err);
        setIsCloudConnected(false);
        setCloudError(err?.message || 'Erro ao conectar ao Firebase');
      }
    };

    // Le o marcador de carga legada antes de assinar as colecoes
    getDoc(seedRef)
      .then(snap => {
        cloudSeed = (snap.exists() ? (snap.data() as SeedVersions) : {}) || {};
      })
      .catch(err => {
        // Sem o marcador (ex.: offline): mantem vazio. A carga legada so acontece com dados
        // vindos do servidor (snapshots do cache sao ignorados por claimSeed), entao nada e
        // sobrescrito e a importacao inicial continua possivel quando a conexao voltar.
        console.warn('Nao foi possivel ler store_settings/seed:', err);
        cloudSeed = {};
      })
      .finally(subscribe);

    return () => {
      cancelled = true;
      unsubscribers.forEach(unsub => unsub());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------
  // Product Actions
  // -------------------------------------------------------------
  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const brand = normalizeBrand(productData);
    const newProduct: Product = {
      ...productData,
      brand,
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };

    commitProducts([newProduct, ...productsRef.current]);
    // Confirma na hora (o setDoc so resolve quando o servidor responde, o que nao ocorre offline)
    showToast(`Produto "${newProduct.name}" cadastrado com sucesso!`, 'success');

    try {
      await cloudSet('products', newProduct.id, newProduct);
      if (cloudEnabled()) setIsCloudConnected(true);
    } catch {
      showToast(`Produto "${newProduct.name}" salvo apenas neste dispositivo (falha na nuvem).`, 'warning');
    }
  };

  const updateProduct = async (id: string, updatedFields: Partial<Product>) => {
    const now = new Date().toISOString();
    let updatedItem: Product | null = null;

    const next = productsRef.current.map(p => {
      if (p.id !== id) return p;
      const merged: Product = { ...p, ...updatedFields, updatedAt: now };
      if (updatedFields.brand !== undefined || updatedFields.name !== undefined || updatedFields.model !== undefined) {
        merged.brand = normalizeBrand(merged);
      }
      updatedItem = merged;
      return merged;
    });
    if (!updatedItem) return;
    commitProducts(next);
    showToast('Produto atualizado com sucesso!', 'success');

    try {
      await cloudSet('products', id, updatedItem);
    } catch {
      showToast('Produto atualizado apenas neste dispositivo (falha na nuvem).', 'warning');
    }
  };

  const deleteProduct = async (id: string) => {
    commitProducts(productsRef.current.filter(p => p.id !== id));
    cloudDeleteQuiet('products', id);
    showToast('Produto removido do estoque.', 'info');
  };

  const updateVariantStock = async (productId: string, variantId: string, newStock: number) => {
    let updatedProduct: Product | null = null;
    const next = productsRef.current.map(p => {
      if (p.id !== productId) return p;
      const variants = p.variants.map(v => (v.id === variantId ? { ...v, stock: Math.max(0, newStock) } : v));
      updatedProduct = { ...p, variants, updatedAt: new Date().toISOString() };
      return updatedProduct;
    });
    if (!updatedProduct) return;
    commitProducts(next);
    cloudSetQuiet('products', productId, updatedProduct);
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

    commitCustomers([newCustomer, ...customersRef.current]);
    cloudSetQuiet('customers', newCustomer.id, newCustomer);

    showToast(`Cliente "${newCustomer.name}" cadastrado com sucesso!`, 'success');
    return newCustomer;
  };

  const updateCustomer = (id: string, updatedFields: Partial<Customer>) => {
    const now = new Date().toISOString();
    let updatedItem: Customer | null = null;
    const next = customersRef.current.map(c => {
      if (c.id !== id) return c;
      updatedItem = { ...c, ...updatedFields, updatedAt: now };
      return updatedItem;
    });
    if (!updatedItem) return;
    commitCustomers(next);
    cloudSetQuiet('customers', id, updatedItem);

    showToast('Dados do cliente atualizados com sucesso!', 'success');
  };

  const deleteCustomer = (id: string) => {
    commitCustomers(customersRef.current.filter(c => c.id !== id));
    cloudDeleteQuiet('customers', id);
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

    commitSuppliers([newSupplier, ...suppliersRef.current]);
    cloudSetQuiet('suppliers', newSupplier.id, newSupplier);

    showToast(`Fornecedor "${newSupplier.tradeName}" cadastrado com sucesso!`, 'success');
    return newSupplier;
  };

  const updateSupplier = (id: string, updatedFields: Partial<Supplier>) => {
    const now = new Date().toISOString();
    let updatedItem: Supplier | null = null;
    const next = suppliersRef.current.map(s => {
      if (s.id !== id) return s;
      updatedItem = { ...s, ...updatedFields, updatedAt: now };
      return updatedItem;
    });
    if (!updatedItem) return;
    commitSuppliers(next);
    cloudSetQuiet('suppliers', id, updatedItem);

    showToast('Fornecedor atualizado com sucesso!', 'success');
  };

  const deleteSupplier = (id: string) => {
    commitSuppliers(suppliersRef.current.filter(s => s.id !== id));
    cloudDeleteQuiet('suppliers', id);
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

    commitPromissories([newContract, ...promissoryRef.current]);
    cloudSetQuiet('promissories', newContract.id, newContract);

    return newContract;
  };

  const updatePromissoryContract = (id: string, updatedFields: Partial<PromissoryContract>) => {
    const now = new Date().toISOString();
    let updatedItem: PromissoryContract | null = null;
    const next = promissoryRef.current.map(c => {
      if (c.id !== id) return c;
      updatedItem = { ...c, ...updatedFields, updatedAt: now };
      return updatedItem;
    });
    if (!updatedItem) return;
    commitPromissories(next);
    cloudSetQuiet('promissories', id, updatedItem);
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

    const next = promissoryRef.current.map(contract => {
      if (contract.id !== contractId) return contract;
      const updatedInstallments = contract.installments.map(inst =>
        inst.id === installmentId
          ? { ...inst, status: 'paid' as const, paidDate: payDate, paidAmount, receivingLocation }
          : inst
      );

      const totalPaid = Number(
        updatedInstallments
          .reduce((sum, i) => sum + (i.status === 'paid' ? i.paidAmount ?? i.amount : 0), 0)
          .toFixed(2)
      );
      const totalUnpaid = Number(Math.max(0, contract.totalSaleAmount - totalPaid).toFixed(2));
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
    });
    if (!updatedContract) return;
    commitPromissories(next);
    cloudSetQuiet('promissories', contractId, updatedContract);

    showToast('Baixa de parcela registrada com sucesso!', 'success');
  };

  const settleContract = (contractId: string, receivingLocation: string): PromissoryContract | null => {
    const now = new Date().toISOString();
    let updatedContract: PromissoryContract | null = null;

    const next = promissoryRef.current.map(contract => {
      if (contract.id !== contractId) return contract;
      const updatedInstallments = contract.installments.map(inst => ({
        ...inst,
        status: 'paid' as const,
        paidDate: inst.paidDate || now,
        paidAmount: inst.paidAmount ?? inst.amount,
        receivingLocation: inst.receivingLocation || receivingLocation,
      }));
      const totalPaid = Number(updatedInstallments.reduce((sum, i) => sum + (i.paidAmount ?? i.amount), 0).toFixed(2));

      updatedContract = {
        ...contract,
        installments: updatedInstallments,
        totalPaidAmount: Math.max(totalPaid, contract.totalSaleAmount),
        totalUnpaidAmount: 0,
        status: 'paid',
        updatedAt: now,
      };
      return updatedContract;
    });
    if (!updatedContract) return null;
    commitPromissories(next);
    cloudSetQuiet('promissories', contractId, updatedContract);
    return updatedContract;
  };

  const payEntirePromissoryContract = (contractId: string, receivingLocation = 'Balcão Quatro Barras') => {
    if (settleContract(contractId, receivingLocation)) {
      showToast('Contrato baixado integralmente com sucesso!', 'success');
    }
  };

  const deletePromissoryContract = (contractId: string) => {
    const contractToDelete = promissoryRef.current.find(c => c.id === contractId);
    if (!contractToDelete) return;

    // 1. Cascade Delete linked Sale (Venda) & Revert Stock
    const linkedSale = salesRef.current.find(
      s => s.id === contractToDelete.saleId || (contractToDelete.saleCode && s.code === contractToDelete.saleCode)
    );

    if (linkedSale) {
      if (linkedSale.status !== 'cancelled') {
        const { next, changed } = applyStockMovement(
          productsRef.current,
          linkedSale.items,
          1,
          new Date().toISOString()
        );
        commitProducts(next);
        changed.forEach(p => cloudSetQuiet('products', p.id, p));
      }

      commitSales(salesRef.current.filter(s => s.id !== linkedSale.id));
      cloudDeleteQuiet('sales', linkedSale.id);
    }

    // 2. Delete Promissory Contract
    commitPromissories(promissoryRef.current.filter(c => c.id !== contractId));
    cloudDeleteQuiet('promissories', contractId);

    showToast(
      linkedSale
        ? `Contrato ${contractToDelete.contractNumber} e venda vinculada removidos com sucesso.`
        : `Contrato ${contractToDelete.contractNumber} removido com sucesso.`,
      'info'
    );
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

    commitBills([newBill, ...billsRef.current]);
    showToast('Conta a pagar cadastrada com sucesso!', 'success');

    try {
      await cloudSet('bills', newBill.id, newBill);
    } catch {
      showToast('Conta salva apenas neste dispositivo (falha na nuvem).', 'warning');
    }
  };

  const updateBillStatus = async (billId: string, status: BillStatus) => {
    let updatedBill: Bill | null = null;
    const next = billsRef.current.map(b => {
      if (b.id !== billId) return b;
      updatedBill = { ...b, status };
      return updatedBill;
    });
    if (!updatedBill) return;
    commitBills(next);
    cloudSetQuiet('bills', billId, updatedBill);

    showToast(`Status da conta atualizado para "${status}"!`);
  };

  const deleteBill = async (billId: string) => {
    commitBills(billsRef.current.filter(b => b.id !== billId));
    cloudDeleteQuiet('bills', billId);
    showToast('Conta removida com sucesso.', 'info');
  };

  // -------------------------------------------------------------
  // Sales & POS Actions
  // -------------------------------------------------------------
  const addSale = (saleData: Omit<Sale, 'id' | 'code' | 'createdAt'>): Sale => {
    const now = new Date().toISOString();
    // Codigo sequencial baseado no MAIOR codigo existente (sales.length gerava codigos
    // repetidos depois que alguma venda era excluida)
    const lastSeq = salesRef.current.reduce((max, s) => Math.max(max, extractSaleNumber(s.code)), 1041);
    const saleCode = `VENDA-${lastSeq + 1}`;
    const saleId = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newSale: Sale = {
      ...saleData,
      id: saleId,
      code: saleCode,
      createdAt: now,
    };

    // Deduct stock for all items sold in POS
    const { next: updatedProducts, changed: changedProducts } = applyStockMovement(
      productsRef.current,
      saleData.items,
      -1,
      now
    );
    commitProducts(updatedProducts);
    commitSales([newSale, ...salesRef.current]);

    // Auto-create PromissoryContract if paymentMethod is promissory_note
    if (newSale.paymentMethod === 'promissory_note') {
      const promDetails = newSale.paymentDetails?.promissory;
      const numInstallments = Math.max(1, promDetails?.installments || 1);
      const contractCode =
        promDetails?.contractNumber ||
        `CTR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Build installments array if not provided
      const installments: PromissoryInstallment[] = [...(promDetails?.installmentDetails || [])];
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
            issueDate: toLocalDateStr(now),
            dueDate: promDetails?.dueDate && i === 1 ? promDetails.dueDate : toLocalDateStr(dueDate),
            amount:
              i === numInstallments
                ? Number((newSale.total - installmentValue * (numInstallments - 1)).toFixed(2))
                : installmentValue,
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

      commitPromissories([newContract, ...promissoryRef.current]);
      cloudSetQuiet('promissories', newContract.id, newContract);
    }

    // Sync Sale & Stock Deductions to Firebase (somente os produtos alterados)
    cloudSetQuiet('sales', newSale.id, newSale);
    changedProducts.forEach(p => cloudSetQuiet('products', p.id, p));

    showToast(`Venda ${saleCode} realizada com sucesso e estoque atualizado!`, 'success');
    return newSale;
  };

  const updateSale = (saleId: string, updatedFields: Partial<Sale>, newItems?: SaleItem[]) => {
    const originalSale = salesRef.current.find(s => s.id === saleId);
    if (!originalSale) return;

    const itemsToSave = newItems || originalSale.items;
    const now = new Date().toISOString();

    // Reconcile stock: devolve os itens antigos e baixa os novos
    if (newItems && originalSale.status !== 'cancelled') {
      const restored = applyStockMovement(productsRef.current, originalSale.items, 1, now);
      const deducted = applyStockMovement(restored.next, newItems, -1, now);
      const before = new Map(productsRef.current.map(p => [p.id, p]));
      const changed: Product[] = [];
      const next = deducted.next.map(p => {
        const old = before.get(p.id);
        // Mantem o objeto original quando o estoque final nao mudou
        if (old && old.variants.every((v, idx) => v.stock === p.variants[idx]?.stock)) return old;
        changed.push(p);
        return p;
      });
      commitProducts(next);
      changed.forEach(p => cloudSetQuiet('products', p.id, p));
    }

    const updatedSale: Sale = {
      ...originalSale,
      ...updatedFields,
      items: itemsToSave,
    };

    commitSales(salesRef.current.map(s => (s.id === saleId ? updatedSale : s)));
    cloudSetQuiet('sales', saleId, updatedSale);

    showToast(`Venda ${originalSale.code} atualizada com sucesso!`, 'success');
  };

  const deleteSale = (saleId: string) => {
    const saleToDelete = salesRef.current.find(s => s.id === saleId);
    if (!saleToDelete) return;

    // Revert stock if sale was active
    if (saleToDelete.status !== 'cancelled') {
      const { next, changed } = applyStockMovement(productsRef.current, saleToDelete.items, 1, new Date().toISOString());
      commitProducts(next);
      changed.forEach(p => cloudSetQuiet('products', p.id, p));
    }

    // 2. Cascade Delete linked Promissory Contract (Crediário)
    const linkedContract = promissoryRef.current.find(
      c => c.saleId === saleId || (saleToDelete.code && c.saleCode === saleToDelete.code)
    );

    if (linkedContract) {
      commitPromissories(promissoryRef.current.filter(c => c.id !== linkedContract.id));
      cloudDeleteQuiet('promissories', linkedContract.id);
    }

    // 3. Delete Sale
    commitSales(salesRef.current.filter(s => s.id !== saleId));
    cloudDeleteQuiet('sales', saleId);

    showToast(
      linkedContract
        ? `Venda ${saleToDelete.code} e crediário vinculado excluídos com sucesso.`
        : `Venda ${saleToDelete.code} excluída com sucesso.`,
      'info'
    );
  };

  const markPromissoryAsPaid = (saleId: string) => {
    const now = new Date().toISOString();
    let updatedSale: Sale | null = null;

    const next = salesRef.current.map(s => {
      if (s.id !== saleId) return s;
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
    });
    if (!updatedSale) return;
    commitSales(next);
    cloudSetQuiet('sales', saleId, updatedSale);

    // Also update any matching promissory contracts
    const contract = promissoryRef.current.find(c => c.saleId === saleId);
    if (contract) settleContract(contract.id, 'Balcão Quatro Barras');

    showToast('Nota promissória liquidada com sucesso!', 'success');
  };

  const cancelSale = (saleId: string) => {
    const originalSale = salesRef.current.find(s => s.id === saleId);
    if (!originalSale || originalSale.status === 'cancelled') return;

    // Return items to inventory
    const { next, changed } = applyStockMovement(productsRef.current, originalSale.items, 1, new Date().toISOString());
    commitProducts(next);

    const updatedSale: Sale = { ...originalSale, status: 'cancelled' };
    commitSales(salesRef.current.map(s => (s.id === saleId ? updatedSale : s)));

    cloudSetQuiet('sales', saleId, updatedSale);
    changed.forEach(p => cloudSetQuiet('products', p.id, p));

    showToast(`Venda ${originalSale.code} cancelada e itens devolvidos ao estoque.`, 'warning');
  };

  const clearERPTransactionsForDelivery = () => {
    try {
      const salesToDel = [...salesRef.current];
      const billsToDel = [...billsRef.current];
      const promToDel = [...promissoryRef.current];

      commitSales([]);
      commitBills([]);
      commitPromissories([]);

      salesToDel.forEach(s => cloudDeleteQuiet('sales', s.id));
      billsToDel.forEach(b => cloudDeleteQuiet('bills', b.id));
      promToDel.forEach(p => cloudDeleteQuiet('promissories', p.id));

      showToast('🧹 Caixa e vendas zerados com sucesso!', 'success');
    } catch (e) {
      console.error('Error clearing ERP transactions:', e);
    }
  };

  const clearAllDataFromDatabase = () => {
    try {
      const prodsToDel = [...productsRef.current];
      const salesToDel = [...salesRef.current];
      const billsToDel = [...billsRef.current];
      const custToDel = [...customersRef.current];
      const suppToDel = [...suppliersRef.current];
      const promToDel = [...promissoryRef.current];

      commitProducts([]);
      commitSales([]);
      commitBills([]);
      commitCustomers([]);
      commitSuppliers([]);
      commitPromissories([]);
      setCart([]);
      saveToLocalStorage(STORAGE_KEYS.CART, []);

      prodsToDel.forEach(p => cloudDeleteQuiet('products', p.id));
      salesToDel.forEach(s => cloudDeleteQuiet('sales', s.id));
      billsToDel.forEach(b => cloudDeleteQuiet('bills', b.id));
      custToDel.forEach(c => cloudDeleteQuiet('customers', c.id));
      suppToDel.forEach(s => cloudDeleteQuiet('suppliers', s.id));
      promToDel.forEach(p => cloudDeleteQuiet('promissories', p.id));

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
