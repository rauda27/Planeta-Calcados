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
  supplierId?: string;
  supplierName?: string;
  department: Department;
  gender: ShoeGender;
  category: ProductCategory;
  collection: string;
  material: string;
  soleType?: string;
  
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

// -------------------------------------------------------------
// CLIENTES & FORNECEDORES
// -------------------------------------------------------------

export interface Customer {
  id: string;
  name: string;
  cpfCnpj: string;
  phone?: string;
  mobile: string; // WhatsApp
  email?: string;
  address?: string;
  bairro?: string;
  city?: string;
  uf?: string;
  cep?: string;
  creditLimit: number;
  totalSpent?: number;
  notes?: string;
  status: 'active' | 'blocked';
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  tradeName: string; // Razão Social / Nome Fantasia
  corporateName?: string;
  cnpjCpf: string;
  phone: string;
  mobile?: string;
  contactPerson?: string;
  email?: string;
  address?: string;
  city?: string;
  uf?: string;
  cep?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// NOTA PROMISSÓRIA & GESTÃO DE DEVEDORES (CONTRATOS E PARCELAS)
// -------------------------------------------------------------

export type InstallmentStatus = 'pending' | 'paid' | 'overdue';

export interface PromissoryInstallment {
  id: string;
  documentNumber: string; // Ex: 50029266
  installmentNumber: number; // Ex: 1
  totalInstallments: number; // Ex: 3 (exibe 1/3)
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  amount: number; // Valor da Parcela
  correctedAmount?: number; // Vr. Corrigido com juros/mora
  paidDate?: string; // Data Pagamento
  paidAmount?: number; // Vlr. Pago
  receivingLocation?: string; // Local Recebimento (ex: Balcão Quatro Barras)
  status: InstallmentStatus;
}

export interface PromissoryContract {
  id: string;
  contractNumber: string; // Ex: pLA4pGQtNL ou 229717511
  saleId: string;
  saleCode: string; // Ex: VENDA-1042
  customerId?: string;
  customerName: string;
  customerCpfCnpj: string;
  customerPhone?: string;
  customerMobile?: string;
  totalSaleAmount: number;
  totalPaidAmount: number;
  totalUnpaidAmount: number;
  installments: PromissoryInstallment[];
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// CONTAS A PAGAR (BOLETOS)
// -------------------------------------------------------------

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
  contractNumber?: string;
  customerName: string;
  customerCpf: string;
  customerPhone: string;
  dueDate: string;
  installments: number;
  installmentDetails?: PromissoryInstallment[];
  isPaid: boolean;
  paidAt?: string;
}

export interface CustomerInfo {
  id?: string;
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
