'use client';

import React, { useState } from 'react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { Search, Plus, Edit, Trash2, Boxes, LayoutGrid, ListFilter, ChevronDown, ChevronRight, PackageCheck, Barcode as BarcodeIcon, Printer } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { ProductLabelModal } from './ProductLabelModal';

interface InventoryTableProps {
  onOpenProductModal: (product?: Product) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({ onOpenProductModal }) => {
  const { products, deleteProduct } = useStore();
  
  // Filter States (Departamento & Marca)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('Todos');
  const [selectedBrand, setSelectedBrand] = useState('Todas');

  // View Mode: 'grouped' (Agrupado por Marca & Departamento) | 'table' (Tabela Geral)
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped');

  // Collapsed Brand Cards state
  const [expandedBrands, setExpandedBrands] = useState<Record<string, boolean>>({});

  // Dynamic dropdown options
  const departments = ['Todos', 'Calçados', 'Roupas', 'Acessórios', 'Perfumes'];
  const brands = ['Todas', ...Array.from(new Set(products.map(p => p.brand)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.department && p.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.material.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === 'Todos' || p.department === selectedDept;
    const matchesBrand = selectedBrand === 'Todas' || p.brand === selectedBrand;

    return matchesSearch && matchesDept && matchesBrand;
  });

  // Group products by Brand
  const groupedByBrand = filteredProducts.reduce((acc, product) => {
    const brand = product.brand || 'Outras Marcas';
    if (!acc[brand]) acc[brand] = [];
    acc[brand].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const toggleBrandExpand = (brand: string) => {
    setExpandedBrands(prev => ({ ...prev, [brand]: !prev[brand] }));
  };

  // Label Modal state
  const [selectedProductForLabels, setSelectedProductForLabels] = useState<Product | null>(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);

  const handleOpenLabelModal = (prod?: Product) => {
    setSelectedProductForLabels(prod || filteredProducts[0] || products[0] || null);
    setIsLabelModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${name}" do sistema ERP?`)) {
      deleteProduct(id);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-brand-primary" />
            Gestão de Estoque por Departamento e Marca
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Controle de inventário separado por Tipo de Produto (Departamento) e Marca com Matriz de Grade
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          {/* View Switcher Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grouped' ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Visão Agrupada</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Tabela</span>
            </button>
          </div>

          {/* Print Barcode Labels Button */}
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => handleOpenLabelModal()}
            icon={<BarcodeIcon className="w-4 h-4 text-brand-primary" />}
            className="border-slate-300 text-slate-800 hover:bg-slate-50 font-bold"
            title="Imprimir Etiquetas com Código de Barras dos Produtos"
          >
            Imprimir Etiquetas
          </Button>

          <Button
            type="button"
            variant="gold"
            size="md"
            onClick={() => onOpenProductModal()}
            icon={<Plus className="w-4 h-4 text-slate-950" />}
          >
            Novo Produto
          </Button>
        </div>
      </div>

      {/* FILTROS LIMPOS: Busca, Tipo de Produto (Departamento) e Marca */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Boxes className="w-4 h-4 text-brand-primary" />
            Filtros do Estoque (Departamento & Marca)
          </span>
          <span className="text-slate-400 font-normal">
            Exibindo {filteredProducts.length} de {products.length} produtos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar Nome, SKU, Marca, EAN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          {/* 1. Tipo de Produto (Departamento) */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="Todos">📦 Tipo: Todos os Departamentos</option>
              {departments.filter(d => d !== 'Todos').map(d => (
                <option key={d} value={d}>📦 Tipo: {d}</option>
              ))}
            </select>
          </div>

          {/* 2. Marca */}
          <div>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="Todas">🏷️ Marca: Todas as Marcas</option>
              {brands.filter(b => b !== 'Todas').map(b => (
                <option key={b} value={b}>🏷️ Marca: {b}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* VIEW 1: GROUPED BY BRAND CARDS */}
      {viewMode === 'grouped' && (
        <div className="space-y-6">
          {Object.keys(groupedByBrand).length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
              Nenhum produto encontrado com os filtros selecionados.
            </div>
          ) : (
            Object.entries(groupedByBrand).map(([brandName, brandProducts]) => {
              const isCollapsed = expandedBrands[brandName] === false;
              const totalBrandStock = brandProducts.reduce(
                (sum, p) => sum + p.variants.reduce((vSum, v) => vSum + v.stock, 0),
                0
              );
              const brandDepts = Array.from(new Set(brandProducts.map(p => p.department)));

              return (
                <div key={brandName} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                  {/* Brand Header */}
                  <div
                    onClick={() => toggleBrandExpand(brandName)}
                    className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isCollapsed ? <ChevronRight className="w-5 h-5 text-brand-gold" /> : <ChevronDown className="w-5 h-5 text-brand-gold" />}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-white tracking-tight">{brandName}</h3>
                          <span className="bg-brand-gold text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full">
                            {brandProducts.length} produto(s)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Departamentos: {brandDepts.join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-right">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">Estoque Total</span>
                        <span className="text-sm font-extrabold text-brand-gold">{totalBrandStock} unidades</span>
                      </div>
                    </div>
                  </div>

                  {/* Brand Items (If Expanded) */}
                  {!isCollapsed && (
                    <div className="divide-y divide-slate-100">
                      {brandProducts.map(product => {
                        const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

                        return (
                          <div key={product.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            {/* Left: Image, Name, Model & Dept */}
                            <div className="flex items-start gap-4 min-w-0 flex-1">
                              <img
                                src={product.images?.[0] || 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&auto=format&fit=crop&q=60'}
                                alt={product.name}
                                className="w-14 h-14 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                              />
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="emerald" size="sm" className="font-bold">
                                    {product.department}
                                  </Badge>
                                  <span className="bg-slate-100 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded border border-slate-200">
                                    Modelo: {product.model}
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-mono">SKU: {product.sku}</span>
                                </div>
                                <h4 className="font-extrabold text-slate-900 text-sm line-clamp-1">{product.name}</h4>
                                <p className="text-xs text-slate-500">
                                  Categoria: <strong>{product.category}</strong> ({product.gender}) • Material: <strong>{product.material}</strong>
                                </p>
                              </div>
                            </div>

                            {/* Center: Price & Markup */}
                            <div className="flex items-center gap-6 shrink-0">
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Preço de Venda</span>
                                <span className="font-extrabold text-brand-primary text-base">
                                  R$ {product.salePrice.toFixed(2).replace('.', ',')}
                                </span>
                                <span className="text-[10px] text-slate-400 block">Custo: R$ {product.costPrice.toFixed(2).replace('.', ',')}</span>
                              </div>

                              <div className="hidden sm:block">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Markup</span>
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 text-xs">
                                  +{product.markupPercentage}%
                                </span>
                              </div>
                            </div>

                            {/* Right: Size Matrix Grid */}
                            <div className="lg:w-72 shrink-0">
                              <div className="flex items-center justify-between mb-1 text-xs">
                                <span className="font-bold text-slate-800">
                                  Matriz de Grade:
                                </span>
                                <span className={`font-bold ${totalStock === 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                                  {totalStock} un
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-1">
                                {product.variants.map((v, i) => (
                                  <span
                                    key={i}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                                      v.stock === 0
                                        ? 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                                        : v.stock <= v.minStock
                                        ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                                        : 'bg-white text-slate-700 border-slate-200'
                                    }`}
                                    title={`Cor: ${v.color} - Tam: ${v.size} - Estoque: ${v.stock}`}
                                  >
                                    {v.size}:{v.stock}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-1.5 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-100">
                              <button
                                type="button"
                                onClick={() => handleOpenLabelModal(product)}
                                className="p-2 text-slate-600 hover:text-brand-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Imprimir Etiquetas com Código de Barras deste Produto"
                              >
                                <BarcodeIcon className="w-4 h-4 text-brand-primary" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenProductModal(product)}
                                className="p-2 text-slate-600 hover:text-brand-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Editar Produto & Grade"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(product.id, product.name)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: FLAT TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Produto / Foto</th>
                <th className="p-3.5">Tipo (Depto)</th>
                <th className="p-3.5">Marca</th>
                <th className="p-3.5">Custo / Venda</th>
                <th className="p-3.5">Matriz de Grade (Estoque)</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Nenhum produto cadastrado com esses parâmetros.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Photo & Name */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.images?.[0] || 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&auto=format&fit=crop&q=60'}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block line-clamp-1">
                              {product.name}
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {product.sku} • Modelo: {product.model}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Tipo (Department) */}
                      <td className="p-3.5">
                        <Badge variant="emerald" size="sm" className="font-bold">
                          {product.department}
                        </Badge>
                      </td>

                      {/* Marca */}
                      <td className="p-3.5">
                        <span className="font-extrabold text-slate-900">{product.brand}</span>
                      </td>

                      {/* Price */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="font-bold text-brand-primary text-sm block">
                            R$ {product.salePrice.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Custo: R$ {product.costPrice.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </td>

                      {/* Grade Matrix Indicator */}
                      <td className="p-3.5 max-w-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-bold ${totalStock === 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                            {totalStock} un
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {product.variants.slice(0, 8).map((v, i) => (
                            <span
                              key={i}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                                v.stock === 0
                                  ? 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                                  : 'bg-white text-slate-700 border-slate-200'
                              }`}
                            >
                              {v.size}:{v.stock}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenLabelModal(product)}
                            className="p-1.5 text-slate-600 hover:text-brand-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Imprimir Etiquetas com Código de Barras"
                          >
                            <BarcodeIcon className="w-4 h-4 text-brand-primary" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenProductModal(product)}
                            className="p-1.5 text-slate-600 hover:text-brand-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Editar Produto & Grade"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product.id, product.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Label Printing Modal */}
      <ProductLabelModal
        product={selectedProductForLabels}
        isOpen={isLabelModalOpen}
        onClose={() => setIsLabelModalOpen(false)}
      />
    </Card>
  );
};
