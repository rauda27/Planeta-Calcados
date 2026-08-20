'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product, ProductVariant, FiscalData, Department, ProductCategory, ShoeGender } from '../../types';
import { useStore } from '../../context/StoreContext';
import { Modal } from '../ui/Modal';
import { Tabs } from '../ui/Tabs';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import {
  Plus,
  Trash2,
  Save,
  Calculator,
  Layers,
  FileText,
  Image as ImageIcon,
  Boxes,
  Upload,
  Link as LinkIcon,
  Star,
  Sparkles,
} from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct?: Product | null;
}

const DEFAULT_FISCAL_DATA: FiscalData = {
  ncm: '',
  cest: '',
  origin: '0 - Nacional',
  cfop: '5102',
  csosn: '102',
  icmsRate: 0,
  pisRate: 0,
  cofinsRate: 0,
  nfeKey: '',
  supplierCnpj: '',
};

// Department Presets for Sizes & Volumes
const DEPARTMENT_SIZES: Record<Department, (string | number)[]> = {
  'Calçados': [33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44],
  'Roupas': ['PP', 'P', 'M', 'G', 'GG', 'XGG'],
  'Acessórios': ['Único', 'P/M', 'G/GG', 'Snapback', 'Strapback'],
  'Perfumes': ['30ml', '50ml', '75ml', '100ml', '200ml', 'Único'],
};

const DEPARTMENT_CATEGORIES: Record<Department, ProductCategory[]> = {
  'Calçados': ['Scarpin', 'Tênis', 'Sapato Social', 'Rasteira', 'Sandália', 'Bota', 'Mocassim', 'Sapatilha', 'Chinelos'],
  'Roupas': ['Camisetas', 'Calças', 'Jaquetas', 'Vestidos', 'Polos'],
  'Acessórios': ['Bonés', 'Cintos', 'Bolsas', 'Carteiras'],
  'Perfumes': ['Perfumes', 'Colônias', 'Cosméticos'],
};

// Helper: Compress and resize image file to optimized Base64
const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const maxWidth = 1080;
        const maxHeight = 1080;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG 85%
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        resolve(compressedBase64);
      };
      img.onerror = err => reject(err);
    };
    reader.onerror = err => reject(err);
  });
};

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  editingProduct,
}) => {
  const { addProduct, updateProduct } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<string>('geral');

  // Form State - Tab 1: General Info
  const [department, setDepartment] = useState<Department>('Calçados');
  const [sku, setSku] = useState('');
  const [mainEan, setMainEan] = useState('');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [gender, setGender] = useState<ShoeGender>('Feminino');
  const [category, setCategory] = useState<ProductCategory>('Tênis');
  const [collection, setCollection] = useState('');
  const [material, setMaterial] = useState('');
  const [soleType, setSoleType] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Form State - Tab 2: Pricing
  const [costPrice, setCostPrice] = useState<number>(0);
  const [freightExpenses, setFreightExpenses] = useState<number>(0);
  const [markupPercentage, setMarkupPercentage] = useState<number>(100);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [promoPrice, setPromoPrice] = useState<number | undefined>(undefined);

  // Form State - Tab 3: Grid Matrix
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Form State - Tab 4: Fiscal Data
  const [fiscalData, setFiscalData] = useState<FiscalData>(DEFAULT_FISCAL_DATA);

  // Populate form state when editing or resetting for new entry
  useEffect(() => {
    if (editingProduct) {
      setDepartment(editingProduct.department || 'Calçados');
      setSku(editingProduct.sku || '');
      setMainEan(editingProduct.mainEan || '');
      setName(editingProduct.name || '');
      setBrand(editingProduct.brand || '');
      setModel(editingProduct.model || '');
      setGender(editingProduct.gender || 'Feminino');
      setCategory(editingProduct.category || 'Tênis');
      setCollection(editingProduct.collection || '');
      setMaterial(editingProduct.material || '');
      setSoleType(editingProduct.soleType || '');
      setImages(editingProduct.images || []);
      setCostPrice(editingProduct.costPrice || 0);
      setFreightExpenses(editingProduct.freightExpenses || 0);
      setMarkupPercentage(editingProduct.markupPercentage || 100);
      setSalePrice(editingProduct.salePrice || 0);
      setPromoPrice(editingProduct.promoPrice);
      setVariants(editingProduct.variants || []);
      setFiscalData(editingProduct.fiscalData || DEFAULT_FISCAL_DATA);
    } else {
      setDepartment('Calçados');
      setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setMainEan('');
      setName('');
      setBrand('');
      setModel('');
      setGender('Feminino');
      setCategory('Tênis');
      setCollection('');
      setMaterial('');
      setSoleType('');
      setImages([]);
      setImageUrlInput('');
      setCostPrice(0);
      setFreightExpenses(0);
      setMarkupPercentage(100);
      setSalePrice(0);
      setPromoPrice(undefined);
      setVariants([]);
      setFiscalData(DEFAULT_FISCAL_DATA);
    }
    setActiveTab('geral');
  }, [editingProduct, isOpen]);

  // Handle department switch
  const handleDepartmentChange = (newDept: Department) => {
    setDepartment(newDept);
    const availableCats = DEPARTMENT_CATEGORIES[newDept];
    if (availableCats && availableCats.length > 0) {
      setCategory(availableCats[0]);
    }
  };

  // Pricing Auto-Calculation
  const calculateSalePrice = (cost: number, freight: number, markup: number) => {
    const base = cost + freight;
    const calculated = base * (1 + markup / 100);
    return Number(calculated.toFixed(2));
  };

  const handleCostOrMarkupChange = (cost: number, freight: number, markup: number) => {
    setCostPrice(cost);
    setFreightExpenses(freight);
    setMarkupPercentage(markup);
    if (cost > 0) {
      setSalePrice(calculateSalePrice(cost, freight, markup));
    }
  };

  // Image Upload Helpers (Computer / Device / Camera)
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const fileArray = Array.from(files);
      const newBase64Images: string[] = [];

      for (const file of fileArray) {
        if (file.type.startsWith('image/')) {
          const compressed = await compressImageFile(file);
          newBase64Images.push(compressed);
        }
      }

      setImages(prev => [...prev, ...newBase64Images]);
    } catch (err) {
      console.error('Error uploading image file:', err);
      alert('Erro ao carregar a imagem. Tente uma foto em formato JPG, PNG ou WebP.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleAddImageUrl = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;
    setImages(prev => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleRemoveImage = (idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSetPrimaryImage = (idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (idx === 0) return;
    setImages(prev => {
      const selected = prev[idx];
      const rest = prev.filter((_, i) => i !== idx);
      return [selected, ...rest];
    });
  };

  // Variant Matrix Helpers
  const handleAddVariantRow = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const defaultSizes = DEPARTMENT_SIZES[department] || [36];
    const defaultSize = defaultSizes[0];

    const newVariant: ProductVariant = {
      id: `v-dyn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      color: 'Preto',
      colorHex: '#000000',
      size: defaultSize,
      stock: 1,
      ean: '',
      minStock: 1,
      shelfLocation: '',
    };
    setVariants(prev => [...prev, newVariant]);
  };

  const handleAddPresetColorGrid = (colorName: string, e: React.MouseEvent) => {
    e.preventDefault();
    const sizeOptions = DEPARTMENT_SIZES[department] || [];
    const newVariants: ProductVariant[] = sizeOptions.map(sz => ({
      id: `v-preset-${Date.now()}-${sz}-${Math.random().toString(36).substring(2, 5)}`,
      color: colorName,
      colorHex:
        colorName.toLowerCase() === 'preto' || colorName.toLowerCase() === 'preta'
          ? '#000000'
          : colorName.toLowerCase() === 'branco' || colorName.toLowerCase() === 'branca'
          ? '#FFFFFF'
          : '#D4AF37',
      size: sz,
      stock: 1,
      ean: '',
      minStock: 1,
      shelfLocation: '',
    }));
    setVariants(prev => [...prev, ...newVariants]);
  };

  const handleUpdateVariant = (id: string, field: keyof ProductVariant, value: any) => {
    setVariants(prev =>
      prev.map(v => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const handleRemoveVariant = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setVariants(prev => prev.filter(v => v.id !== id));
  };

  // SUBMIT HANDLER
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Por favor, preencha o nome do produto.');
      setActiveTab('geral');
      return;
    }

    if (variants.length === 0) {
      alert('Adicione pelo menos uma variação na Matriz de Grade (Aba 3).');
      setActiveTab('matriz');
      return;
    }

    const payload = {
      sku: sku.trim() || `SKU-${Date.now()}`,
      mainEan: mainEan.trim() || undefined,
      name: name.trim(),
      brand: brand.trim() || 'Planeta Calçados',
      model: model.trim() || name.trim(),
      department,
      gender,
      category,
      collection: collection.trim() || 'Geral',
      material: material.trim() || 'Padrão',
      soleType: department === 'Calçados' ? (soleType.trim() || undefined) : undefined,
      costPrice,
      freightExpenses,
      markupPercentage,
      salePrice: salePrice > 0 ? salePrice : (costPrice + freightExpenses),
      promoPrice: promoPrice || undefined,
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80'],
      variants,
      fiscalData,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
    } else {
      addProduct(payload);
    }

    onClose();
  };

  const tabs = [
    { id: 'geral', label: '1. Dados Gerais & Fotos', icon: <Layers className="w-4 h-4" /> },
    { id: 'precificacao', label: '2. Precificação', icon: <Calculator className="w-4 h-4" /> },
    { id: 'matriz', label: '3. Matriz de Grade', icon: <Boxes className="w-4 h-4" />, badge: variants.length },
    { id: 'fiscal', label: '4. Dados Fiscais (NFe)', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingProduct ? `Editar Produto: ${editingProduct.name}` : 'Cadastrar Novo Produto'}
      subtitle="Preencha os dados do item, departamento, fotos do computador ou link, e grade de tamanhos"
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tabs Bar */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* TAB 1: DADOS GERAIS & FOTOS */}
        {activeTab === 'geral' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Departamento *</label>
                <select
                  value={department}
                  onChange={e => handleDepartmentChange(e.target.value as Department)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white font-semibold text-slate-800"
                >
                  <option value="Calçados">Calçados (Sapatos, Tênis)</option>
                  <option value="Roupas">Roupas / Vestuário</option>
                  <option value="Acessórios">Acessórios / Bolsas</option>
                  <option value="Perfumes">Perfumes / Cosméticos</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gênero / Público *</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as ShoeGender)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white text-slate-800"
                >
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Unissex">Unissex</option>
                  <option value="Infantil">Infantil</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as ProductCategory)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white text-slate-800"
                >
                  {(DEPARTMENT_CATEGORIES[department] || []).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Nome do Produto *"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Tênis Esportivo Casual Preto..."
                  required
                />
              </div>
              <Input
                label="Código SKU *"
                value={sku}
                onChange={e => setSku(e.target.value)}
                placeholder="Ex: SKU-1001"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Marca / Fabricante *"
                value={brand}
                onChange={e => setBrand(e.target.value)}
                placeholder="Ex: Vizzano, Olympikus, Modare, Moleca..."
              />
              <Input
                label="Modelo / Linha"
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder="Ex: Air Comfort, Casual Urban..."
              />
              <Input
                label="EAN / Código de Barras Principal"
                value={mainEan}
                onChange={e => setMainEan(e.target.value)}
                placeholder="7890000000000"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Coleção / Temporada"
                value={collection}
                onChange={e => setCollection(e.target.value)}
                placeholder="Ex: Primavera/Verão, Inverno..."
              />
              <Input
                label="Material Predominante"
                value={material}
                onChange={e => setMaterial(e.target.value)}
                placeholder="Ex: Sintético, Couro, Tecido Mesh..."
              />
              {department === 'Calçados' && (
                <Input
                  label="Tipo de Solado"
                  value={soleType}
                  onChange={e => setSoleType(e.target.value)}
                  placeholder="Ex: Borracha TR, EVA Antiderrapante..."
                />
              )}
            </div>

            {/* ADVANCED IMAGE MANAGEMENT (FILES FROM COMPUTER & URL LINKS) */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-brand-primary" />
                    <span>Fotos do Produto ({images.length})</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Você pode enviar fotos direto do seu computador/celular ou colar links de imagem.
                  </p>
                </div>

                {images.length > 0 && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    ⭐ A 1ª foto é a Principal da Vitrine
                  </span>
                )}
              </div>

              {/* Upload Box (Computer File & Drag and Drop) */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-brand-primary bg-brand-primary/5 scale-[0.99]'
                    : 'border-slate-300 hover:border-brand-primary bg-white'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={e => handleFileUpload(e.target.files)}
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    {isUploading ? (
                      <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6 text-brand-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {isUploading
                        ? 'Otimizando e carregando foto...'
                        : 'Clique para escolher fotos do seu Computador / Celular'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Ou arraste e solte seus arquivos de imagem aqui (JPG, PNG, WebP)
                    </p>
                  </div>
                </div>
              </div>

              {/* Alternative: Add Image by URL */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                  <LinkIcon className="w-3 h-3 text-slate-400" />
                  <span>Ou adicione por link da web (URL):</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={e => setImageUrlInput(e.target.value)}
                    placeholder="https://exemplo.com/foto-do-calcado.jpg"
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    Adicionar Link
                  </button>
                </div>
              </div>

              {/* Photos Preview Gallery */}
              {images.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <p className="text-[11px] font-bold text-slate-700">Fotos cadastradas:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className={`relative group rounded-xl overflow-hidden border-2 bg-white aspect-square shadow-sm transition-all ${
                          idx === 0 ? 'border-brand-gold ring-2 ring-brand-gold/30' : 'border-slate-200'
                        }`}
                      >
                        <img src={img} alt={`foto-${idx + 1}`} className="w-full h-full object-cover" />
                        
                        {/* Primary Badge */}
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-brand-gold text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-slate-950" />
                            Principal
                          </span>
                        )}

                        {/* Hover Overlay Controls */}
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={(e) => handleSetPrimaryImage(idx, e)}
                              className="bg-brand-gold hover:bg-amber-400 text-slate-950 text-[10px] font-bold px-2 py-1 rounded cursor-pointer"
                              title="Tornar Foto Principal"
                            >
                              Tornar 1ª
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleRemoveImage(idx, e)}
                            className="bg-rose-600 hover:bg-rose-700 text-white p-1 rounded cursor-pointer"
                            title="Remover Foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PRECIFICAÇÃO */}
        {activeTab === 'precificacao' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                label="Preço de Custo (R$)"
                type="number"
                step="0.01"
                value={costPrice === 0 ? '' : costPrice}
                onChange={e => handleCostOrMarkupChange(Number(e.target.value), freightExpenses, markupPercentage)}
                placeholder="0.00"
              />
              <Input
                label="Frete / Despesas por Par (R$)"
                type="number"
                step="0.01"
                value={freightExpenses === 0 ? '' : freightExpenses}
                onChange={e => handleCostOrMarkupChange(costPrice, Number(e.target.value), markupPercentage)}
                placeholder="0.00"
              />
              <Input
                label="Margem Markup Desejada (%)"
                type="number"
                step="1"
                value={markupPercentage}
                onChange={e => handleCostOrMarkupChange(costPrice, freightExpenses, Number(e.target.value))}
                placeholder="100"
              />
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <label className="block text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                  Preço de Venda Final *
                </label>
                <div className="flex items-baseline gap-1 text-emerald-950 font-black text-xl">
                  <span className="text-sm font-semibold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={salePrice === 0 ? '' : salePrice}
                    onChange={e => setSalePrice(Number(e.target.value))}
                    className="w-full bg-transparent font-black text-xl text-emerald-950 focus:outline-none"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-amber-900">Preço Promocional (Opcional)</h4>
                <p className="text-[11px] text-amber-700">Se preenchido, exibirá uma etiqueta de promoção na vitrine pública.</p>
              </div>
              <div className="w-36">
                <input
                  type="number"
                  step="0.01"
                  value={promoPrice || ''}
                  onChange={e => setPromoPrice(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Ex: 89.90"
                  className="w-full border border-amber-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MATRIZ DE GRADE DE TAMANHOS */}
        {activeTab === 'matriz' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 p-3 rounded-xl">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Grade de Tamanhos & Cores</h4>
                <p className="text-[11px] text-slate-500">Defina os tamanhos, quantidades em estoque e local físico na loja.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => handleAddPresetColorGrid('Preto', e)}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 cursor-pointer"
                >
                  + Grade Completa (Preto)
                </button>
                <button
                  type="button"
                  onClick={(e) => handleAddVariantRow(e)}
                  className="px-3 py-1.5 bg-brand-primary text-white rounded-lg text-xs font-bold hover:bg-brand-primary/90 cursor-pointer"
                >
                  + Adicionar Linha
                </button>
              </div>
            </div>

            {variants.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
                <Boxes className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Nenhuma numeração cadastrada ainda.</p>
                <button
                  type="button"
                  onClick={(e) => handleAddVariantRow(e)}
                  className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  + Adicionar Primeira Numeração
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Cor</th>
                      <th className="py-2.5 px-3">Tamanho</th>
                      <th className="py-2.5 px-3">Qtd Estoque</th>
                      <th className="py-2.5 px-3">Mínimo</th>
                      <th className="py-2.5 px-3">Local no Depósito / Loja</th>
                      <th className="py-2.5 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {variants.map(v => (
                      <tr key={v.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={v.color}
                            onChange={e => handleUpdateVariant(v.id, 'color', e.target.value)}
                            placeholder="Ex: Preto, Branco..."
                            className="w-28 border border-slate-200 rounded p-1.5 text-xs"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={v.size}
                            onChange={e => handleUpdateVariant(v.id, 'size', isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value))}
                            placeholder="36, M, Único"
                            className="w-20 border border-slate-200 rounded p-1.5 text-xs font-bold text-center"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            value={v.stock}
                            onChange={e => handleUpdateVariant(v.id, 'stock', Number(e.target.value))}
                            className="w-20 border border-slate-200 rounded p-1.5 text-xs font-bold text-center text-emerald-700"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            value={v.minStock}
                            onChange={e => handleUpdateVariant(v.id, 'minStock', Number(e.target.value))}
                            className="w-16 border border-slate-200 rounded p-1.5 text-xs text-center text-amber-700"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={v.shelfLocation || ''}
                            onChange={e => handleUpdateVariant(v.id, 'shelfLocation', e.target.value)}
                            placeholder="Ex: Prateleira 01, Vitrine..."
                            className="w-full border border-slate-200 rounded p-1.5 text-xs"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => handleRemoveVariant(v.id, e)}
                            className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DADOS FISCAIS */}
        {activeTab === 'fiscal' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="NCM (Nomenclatura Comum Mercosul)"
                value={fiscalData.ncm}
                onChange={e => setFiscalData(prev => ({ ...prev, ncm: e.target.value }))}
                placeholder="Ex: 6403.99.90"
              />
              <Input
                label="CEST (Substituição Tributária)"
                value={fiscalData.cest || ''}
                onChange={e => setFiscalData(prev => ({ ...prev, cest: e.target.value }))}
                placeholder="Ex: 28.057.00"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="CFOP Padrão"
                value={fiscalData.cfop}
                onChange={e => setFiscalData(prev => ({ ...prev, cfop: e.target.value }))}
                placeholder="5102"
              />
              <Input
                label="CSOSN / Tributação"
                value={fiscalData.csosn}
                onChange={e => setFiscalData(prev => ({ ...prev, csosn: e.target.value }))}
                placeholder="102"
              />
              <Input
                label="Origem da Mercadoria"
                value={fiscalData.origin}
                onChange={e => setFiscalData(prev => ({ ...prev, origin: e.target.value }))}
                placeholder="0 - Nacional"
              />
            </div>
          </div>
        )}

        {/* Form Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="gold" size="lg" icon={<Save className="w-4 h-4 text-slate-950" />}>
            {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
