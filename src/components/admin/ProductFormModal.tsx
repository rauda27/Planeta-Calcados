'use client';

import React, { useState, useEffect } from 'react';
import { Product, ProductVariant, FiscalData, Department, ProductCategory, ShoeGender } from '../../types';
import { useStore } from '../../context/StoreContext';
import { Modal } from '../ui/Modal';
import { Tabs } from '../ui/Tabs';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Plus, Trash2, Save, Calculator, Layers, FileText, Image as ImageIcon, Check, Sparkles, Tag, Boxes } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct?: Product | null;
}

const DEFAULT_FISCAL_DATA: FiscalData = {
  ncm: '6403.99.90',
  cest: '28.057.00',
  origin: '0 - Nacional',
  cfop: '5102',
  csosn: '102',
  icmsRate: 18.0,
  pisRate: 1.65,
  cofinsRate: 7.6,
  nfeKey: '35260812345678000199550010000082301987654321',
  supplierCnpj: '61.033.123/0001-45',
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

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  editingProduct,
}) => {
  const { addProduct, updateProduct } = useStore();
  const [activeTab, setActiveTab] = useState<string>('geral');

  // Form State - Tab 1: General Info
  const [department, setDepartment] = useState<Department>('Calçados');
  const [sku, setSku] = useState('');
  const [mainEan, setMainEan] = useState('');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [gender, setGender] = useState<ShoeGender>('Feminino');
  const [category, setCategory] = useState<ProductCategory>('Scarpin');
  const [collection, setCollection] = useState('Primavera/Verão 2026');
  const [material, setMaterial] = useState('Sintético Premium');
  const [soleType, setSoleType] = useState('Borracha Antiderrapante');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [images, setImages] = useState<string[]>([]);

  // Form State - Tab 2: Pricing
  const [costPrice, setCostPrice] = useState<number>(50);
  const [freightExpenses, setFreightExpenses] = useState<number>(4);
  const [markupPercentage, setMarkupPercentage] = useState<number>(120);
  const [salePrice, setSalePrice] = useState<number>(118.80);
  const [promoPrice, setPromoPrice] = useState<number | undefined>(undefined);

  // Form State - Tab 3: Grid Matrix
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Form State - Tab 4: Fiscal Data
  const [fiscalData, setFiscalData] = useState<FiscalData>(DEFAULT_FISCAL_DATA);

  // Populate form state when editing or creating
  useEffect(() => {
    if (editingProduct) {
      setDepartment(editingProduct.department || 'Calçados');
      setSku(editingProduct.sku);
      setMainEan(editingProduct.mainEan);
      setName(editingProduct.name);
      setBrand(editingProduct.brand);
      setModel(editingProduct.model);
      setGender(editingProduct.gender);
      setCategory(editingProduct.category);
      setCollection(editingProduct.collection);
      setMaterial(editingProduct.material);
      setSoleType(editingProduct.soleType || 'N/A');
      setImages(editingProduct.images || []);
      setCostPrice(editingProduct.costPrice);
      setFreightExpenses(editingProduct.freightExpenses);
      setMarkupPercentage(editingProduct.markupPercentage);
      setSalePrice(editingProduct.salePrice);
      setPromoPrice(editingProduct.promoPrice);
      setVariants(editingProduct.variants || []);
      setFiscalData(editingProduct.fiscalData || DEFAULT_FISCAL_DATA);
    } else {
      // New product defaults
      const initialDept: Department = 'Calçados';
      setDepartment(initialDept);
      setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setMainEan(`789${Math.floor(1000000000 + Math.random() * 9000000000)}`);
      setName('');
      setBrand('Vizzano');
      setModel('');
      setGender('Feminino');
      setCategory('Scarpin');
      setCollection('Primavera/Verão 2026');
      setMaterial('Pelica Sintética');
      setSoleType('Borracha TR');
      setImages(['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80']);
      setCostPrice(60);
      setFreightExpenses(5);
      setMarkupPercentage(115);
      setSalePrice(139.75);
      setPromoPrice(undefined);
      
      // Default initial matrix for Calçados
      setVariants([
        { id: 'v-init-1', color: 'Preta', colorHex: '#000000', size: 35, stock: 5, ean: '7891111111111', minStock: 2, shelfLocation: 'Corredor A - Prateleira 01' },
        { id: 'v-init-2', color: 'Preta', colorHex: '#000000', size: 36, stock: 8, ean: '7891111111112', minStock: 3, shelfLocation: 'Corredor A - Prateleira 01' },
        { id: 'v-init-3', color: 'Preta', colorHex: '#000000', size: 37, stock: 10, ean: '7891111111113', minStock: 3, shelfLocation: 'Corredor A - Prateleira 01' },
        { id: 'v-init-4', color: 'Preta', colorHex: '#000000', size: 38, stock: 4, ean: '7891111111114', minStock: 2, shelfLocation: 'Corredor A - Prateleira 01' },
      ]);
      setFiscalData(DEFAULT_FISCAL_DATA);
    }
    setActiveTab('geral');
  }, [editingProduct, isOpen]);

  // Handle department switch
  const handleDepartmentChange = (newDept: Department) => {
    setDepartment(newDept);
    // Automatically adjust category default
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
    setSalePrice(calculateSalePrice(cost, freight, markup));
  };

  // Image helpers
  const handleAddImage = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;
    setImages(prev => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleRemoveImage = (idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  // Variant Matrix Helpers
  const handleAddVariantRow = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const defaultSizes = DEPARTMENT_SIZES[department] || [36];
    const defaultSize = defaultSizes[0];

    const newVariant: ProductVariant = {
      id: `v-dyn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      color: 'Preta',
      colorHex: '#000000',
      size: defaultSize,
      stock: 5,
      ean: `789${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      minStock: 2,
      shelfLocation: 'Depósito Central',
    };
    setVariants(prev => [...prev, newVariant]);
  };

  // Add preset sizes for a color
  const handleAddPresetColorGrid = (colorName: string, e: React.MouseEvent) => {
    e.preventDefault();
    const sizeOptions = DEPARTMENT_SIZES[department] || [];
    const newVariants: ProductVariant[] = sizeOptions.map(sz => ({
      id: `v-preset-${Date.now()}-${sz}-${Math.random().toString(36).substring(2, 5)}`,
      color: colorName,
      colorHex: colorName.toLowerCase() === 'preta' ? '#000000' : colorName.toLowerCase() === 'branca' ? '#FFFFFF' : '#D4AF37',
      size: sz,
      stock: 5,
      ean: `789${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      minStock: 2,
      shelfLocation: 'Depósito Central',
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

  // SUBMIT HANDLER - Only triggered by the final submit button!
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
      sku,
      mainEan,
      name,
      brand,
      model,
      department,
      gender,
      category,
      collection,
      material,
      soleType: department === 'Calçados' ? soleType : undefined,
      costPrice,
      freightExpenses,
      markupPercentage,
      salePrice,
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
    { id: 'geral', label: '1. Dados Gerais', icon: <Layers className="w-4 h-4" /> },
    { id: 'precificacao', label: '2. Precificação', icon: <Calculator className="w-4 h-4" /> },
    { id: 'matriz', label: '3. Matriz de Grade', icon: <Boxes className="w-4 h-4" />, badge: variants.length },
    { id: 'fiscal', label: '4. Dados Fiscais (NFe)', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingProduct ? `Editar Produto: ${editingProduct.name}` : 'Cadastrar Novo Produto no ERP'}
      subtitle="Defina departamento, variações de grade, precificação e tributos NFe"
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tabs Bar with explicit type="button" */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* TAB 1: DADOS GERAIS */}
        {activeTab === 'geral' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Department Selection */}
            <div>
              <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">
                Selecione o Departamento do Produto *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['Calçados', 'Roupas', 'Acessórios', 'Perfumes'] as Department[]).map(dept => {
                  const isSelected = department === dept;
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => handleDepartmentChange(dept)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-brand-primary text-white border-brand-primary ring-2 ring-brand-gold/40 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span>{dept}</span>
                      <span className={`text-[10px] font-normal ${isSelected ? 'text-brand-gold' : 'text-slate-400'}`}>
                        {dept === 'Calçados' ? 'Grade 33-44' : dept === 'Roupas' ? 'Grade PP-XGG' : dept === 'Acessórios' ? 'Snapback/Único' : 'Frascos/ml'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
              <Input
                label="Nome do Produto *"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Camiseta Polo Premium / Scarpin Vizzano"
                required
              />
              <Input
                label="SKU Principal"
                value={sku}
                onChange={e => setSku(e.target.value)}
                placeholder="SKU-8230"
              />
              <Input
                label="Código EAN-13 Principal"
                value={mainEan}
                onChange={e => setMainEan(e.target.value)}
                placeholder="7891234567890"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Marca *</label>
                <input
                  type="text"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white"
                  placeholder="Marca/Fabricante"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Modelo</label>
                <input
                  type="text"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white"
                  placeholder="Modelo/Edição"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gênero</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as ShoeGender)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white cursor-pointer"
                >
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Unissex">Unissex</option>
                  <option value="Infantil">Infantil</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria do Departamento</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as ProductCategory)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white cursor-pointer"
                >
                  {DEPARTMENT_CATEGORIES[department]?.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Coleção / Temporada"
                value={collection}
                onChange={e => setCollection(e.target.value)}
                placeholder="Primavera/Verão 2026"
              />
              <Input
                label="Material Predominante"
                value={material}
                onChange={e => setMaterial(e.target.value)}
                placeholder={department === 'Calçados' ? 'Pelica Sintética' : department === 'Roupas' ? 'Algodão 100%' : 'Material'}
              />
              {department === 'Calçados' && (
                <Input
                  label="Tipo de Solado"
                  value={soleType}
                  onChange={e => setSoleType(e.target.value)}
                  placeholder="Borracha Antiderrapante TR"
                />
              )}
            </div>

            {/* Photos */}
            <div className="border-t border-slate-100 pt-4">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Fotos do Produto (URL)
              </label>
              <div className="flex gap-2 mb-3">
                <Input
                  value={imageUrlInput}
                  onChange={e => setImageUrlInput(e.target.value)}
                  placeholder="Cole o link da imagem (HTTPS)..."
                  className="flex-1"
                />
                <Button type="button" variant="secondary" onClick={handleAddImage}>
                  Adicionar Foto
                </Button>
              </div>

              {/* Photos Preview */}
              <div className="flex flex-wrap gap-3">
                {images.map((url, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => handleRemoveImage(idx, e)}
                      className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRECIFICAÇÃO */}
        {activeTab === 'precificacao' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex items-center gap-3">
              <Calculator className="w-6 h-6 text-brand-primary shrink-0" />
              <div>
                <strong className="block font-bold">Cálculo Automático do Preço de Venda</strong>
                <span>Preço Venda = (Custo + Frete/Despesas) × (1 + Markup / 100)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Preço de Custo (R$) *"
                type="number"
                step="0.01"
                value={costPrice}
                onChange={e => handleCostOrMarkupChange(Number(e.target.value), freightExpenses, markupPercentage)}
                required
              />
              <Input
                label="Despesas / Frete (R$)"
                type="number"
                step="0.01"
                value={freightExpenses}
                onChange={e => handleCostOrMarkupChange(costPrice, Number(e.target.value), markupPercentage)}
              />
              <Input
                label="% Markup Desejado (%) *"
                type="number"
                step="1"
                value={markupPercentage}
                onChange={e => handleCostOrMarkupChange(costPrice, freightExpenses, Number(e.target.value))}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Preço de Venda Varejo (R$) (Calculado) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={salePrice}
                    onChange={e => setSalePrice(Number(e.target.value))}
                    className="w-full bg-white border-2 border-brand-primary rounded-xl pl-9 pr-4 py-2.5 text-base font-extrabold text-brand-primary focus:outline-none"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Lucro estimado: R$ {(salePrice - (costPrice + freightExpenses)).toFixed(2)} por unidade</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Preço Promocional (Opcional) (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={promoPrice || ''}
                    onChange={e => setPromoPrice(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Ex: 99.90"
                    className="w-full bg-white border border-amber-300 rounded-xl pl-9 pr-4 py-2.5 text-base font-bold text-amber-900 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Exibido com destaque de oferta no catálogo público</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MATRIZ DE GRADE ADAPTÁVEL */}
        {activeTab === 'matriz' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-brand-primary" />
                  Matriz de Grade — Departamento: <span className="text-brand-primary underline">{department}</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Cadastre as variações por Cor + Tamanho/Volume específico do departamento
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => handleAddPresetColorGrid('Preta', e)}
                >
                  + Grade Preta
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={(e) => handleAddVariantRow(e)}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Adicionar Linha
                </Button>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-72">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5">Cor / Variação</th>
                    <th className="p-2.5">Tamanho / Volume ({department})</th>
                    <th className="p-2.5">Estoque Atual</th>
                    <th className="p-2.5">Estoque Mínimo</th>
                    <th className="p-2.5">EAN Individual</th>
                    <th className="p-2.5">Prateleira / Depósito</th>
                    <th className="p-2.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {variants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Nenhuma variação na grade. Clique no botão "Adicionar Linha" para iniciar.
                      </td>
                    </tr>
                  ) : (
                    variants.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50">
                        <td className="p-2">
                          <input
                            type="text"
                            value={v.color}
                            onChange={e => handleUpdateVariant(v.id, 'color', e.target.value)}
                            className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                            placeholder="Ex: Preta, Nude, Azul"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={v.size}
                            onChange={e => handleUpdateVariant(v.id, 'size', e.target.value)}
                            className="w-full border border-slate-200 rounded px-2 py-1 text-xs font-bold bg-white cursor-pointer"
                          >
                            {DEPARTMENT_SIZES[department]?.map(sz => (
                              <option key={sz} value={sz}>{sz}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={v.stock}
                            min="0"
                            onChange={e => handleUpdateVariant(v.id, 'stock', Number(e.target.value))}
                            className="w-20 border border-slate-200 rounded px-2 py-1 text-xs font-bold text-brand-primary"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={v.minStock}
                            min="0"
                            onChange={e => handleUpdateVariant(v.id, 'minStock', Number(e.target.value))}
                            className="w-16 border border-slate-200 rounded px-2 py-1 text-xs text-amber-700"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={v.ean}
                            onChange={e => handleUpdateVariant(v.id, 'ean', e.target.value)}
                            className="w-full border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={v.shelfLocation}
                            onChange={e => handleUpdateVariant(v.id, 'shelfLocation', e.target.value)}
                            className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                            placeholder="Ex: Depósito A"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <button
                            type="button"
                            onClick={(e) => handleRemoveVariant(v.id, e)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: DADOS FISCAIS */}
        {activeTab === 'fiscal' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <strong className="font-bold block text-sm text-emerald-900">Tributação NFC-e / NFe Simplificada:</strong>
              <p className="text-slate-700">
                Para emissão fiscal de balcão e notas fiscais de saída, informe unicamente o código <strong>NCM (Nomenclatura Comum do Mercosul)</strong> do produto.
              </p>
            </div>

            <div className="max-w-md">
              <Input
                label="Código NCM da Mercadoria (8 dígitos) *"
                value={fiscalData.ncm}
                onChange={e => setFiscalData({ ...fiscalData, ncm: e.target.value })}
                placeholder="Ex: 6403.99.90"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                💡 <strong>Exemplos comuns de NCM:</strong><br />
                • <strong>Calçados de Couro / Sapatos:</strong> 6403.99.90<br />
                • <strong>Tênis Esportivos / Borracha:</strong> 6404.11.00<br />
                • <strong>Roupas / Vestuário em Algodão:</strong> 6105.10.00<br />
                • <strong>Perfumes & Cosméticos:</strong> 3303.00.10
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions — ONLY THIS BUTTON SUBMITS THE FORM! */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>

          <Button type="submit" variant="primary" icon={<Save className="w-4 h-4 text-brand-gold" />}>
            {editingProduct ? 'Salvar Alterações no Produto' : 'Cadastrar Produto no Estoque'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
