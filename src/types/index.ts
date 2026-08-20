export type Department = 
  | 'Calçados'
  | 'Roupas'
  | 'Acessórios'
  | 'Perfumes';

export type ProductCategory = 
  // Calçados
  | 'Tênis'
  | 'Sapato Social'
  | 'Rasteira'
  | 'Sandália'
  | 'Bota'
  | 'Mocassim'
  | 'Scarpin'
  | 'Sapatilha'
  | 'Chinelos'
  // Roupas
  | 'Camisetas'
  | 'Calças'
  | 'Jaquetas'
  | 'Vestidos'
  | 'Polos'
  // Acessórios
  | 'Bonés'
  | 'Cintos'
  | 'Bolsas'
  | 'Carteiras'
  // Perfumes
  | 'Perfumes'
  | 'Colônias'
  | 'Cosméticos';

export type ShoeGender = 'Feminino' | 'Masculino' | 'Unissex' | 'Infantil';

export interface ProductVariant {
  id: string;
  color: string;
  colorHex?: string;
  size: string | number; // e.g. 39, "M", "Único", "100ml", "Snapback"
  stock: number;
  ean: string;
  minStock: number;
  shelfLocation: string; // e.g. "Corredor A - Prateleira 03"
}

export interface FiscalData {
  ncm: string;
  cest: string;
  origin: string;
  cfop: string;
  csosn: string;
  icmsRate: number;
  pisRate: number;
  cofinsRate: number;
  nfeKey: string;
  supplierCnpj: string;
}

export interface Product {
  id: string;
  sku: string;
  mainEan: string;
  name: string;
  brand: string;
  model: string;
  department: Department;
  gender: ShoeGender;
  category: ProductCategory;
  collection: string;
  material: string; // e.g. "Couro Legítimo", "Algodão 100%", "Essência Importada"
  soleType?: string; // e.g. "EVA Confort", "N/A"
  
  // Pricing
  costPrice: number;
  freightExpenses: number;
  markupPercentage: number;
  salePrice: number;
  promoPrice?: number;
  
  // Media
  images: string[];
  
  // Grid Matrix
  variants: ProductVariant[];
  
  // Fiscal Data
  fiscalData: FiscalData;
  
  createdAt: string;
  updatedAt: string;
}

export interface StoreBanners {
  heroBannerImage: string;
  femBannerImage: string;
  tenisBannerImage: string;
  mascBannerImage: string;
  acessoriosBannerImage: string;
}

export type BillCategory = 
  | 'Estoque' 
  | 'Aluguel' 
  | 'Impostos' 
  | 'Energia/Água' 
  | 'Marketing' 
  | 'Salários' 
  | 'Outros';

export type BillStatus = 'Pendente' | 'Pago' | 'Atrasado';

export interface Bill {
  id: string;
  supplier: string;
  description: string;
  category: BillCategory;
  amount: number;
  issueDate: string;
  dueDate: string;
  barcode: string;
  status: BillStatus;
  pdfUrl?: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface CartItem {
  id: string;
  product: Product;
  selectedSize: string | number;
  selectedColor: string;
  quantity: number;
}

export interface FilterState {
  search: string;
  departments: Department[];
  categories: ProductCategory[];
  brands: string[];
  sizes: (string | number)[];
  colors: string[];
  maxPrice: number;
}

// -------------------------------------------------------------
// POS & SALES MODULE TYPES
// -------------------------------------------------------------

export type PaymentMethod = 
  | 'money' 
  | 'credit_card' 
  | 'debit_card' 
  | 'pix' 
  | 'promissory_note';

export type SaleStatus = 'completed' | 'promissory_pending' | 'cancelled';

export interface PromissoryDetails {
  customerName: string;
  customerCpf: string;
  customerPhone: string;
  dueDate: string;
  installments: number;
  isPaid: boolean;
  paidAt?: string;
}

export interface CustomerInfo {
  name: string;
  cpf: string;
  phone: string;
}

export interface SaleItem {
  productId: string;
  variantId: string;
  productName: string;
  brand: string;
  sku: string;
  selectedSize: string | number;
  selectedColor: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface Sale {
  id: string;
  code: string; // e.g. "VENDA-1042"
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentDetails?: {
    cashReceived?: number;
    change?: number;
    creditInstallments?: number;
    promissory?: PromissoryDetails;
  };
  customer?: CustomerInfo;
  status: SaleStatus;
  createdAt: string;
}
