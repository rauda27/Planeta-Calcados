'use client';

import React from 'react';
import { FilterState, Department, ProductCategory } from '../../types';
import { Filter, RotateCcw, Check, Boxes } from 'lucide-react';

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  availableBrands: string[];
  availableColors: string[];
}

const AVAILABLE_DEPARTMENTS: Department[] = ['Calçados', 'Roupas', 'Acessórios', 'Perfumes'];

const AVAILABLE_CATEGORIES: ProductCategory[] = [
  'Tênis',
  'Sapato Social',
  'Rasteira',
  'Sandália',
  'Bota',
  'Scarpin',
  'Blusa',
  'Body',
  'Conjunto',
  'Regata',
  'Short',
  'Camisetas',
  'Vestidos',
  'Polos',
  'Bonés',
  'Perfumes',
];

const AVAILABLE_SIZES = [34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 'P', 'M', 'G', 'GG', '100ml'];

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  availableBrands,
  availableColors,
}) => {
  const toggleDepartment = (dept: Department) => {
    const isSelected = filters.departments.includes(dept);
    const newDepts = isSelected
      ? filters.departments.filter(d => d !== dept)
      : [...filters.departments, dept];
    onFilterChange({ ...filters, departments: newDepts });
  };

  const toggleSize = (size: string | number) => {
    const isSelected = filters.sizes.includes(size);
    const newSizes = isSelected
      ? filters.sizes.filter(s => s !== size)
      : [...filters.sizes, size];
    onFilterChange({ ...filters, sizes: newSizes });
  };

  const toggleCategory = (cat: ProductCategory) => {
    const isSelected = filters.categories.includes(cat);
    const newCats = isSelected
      ? filters.categories.filter(c => c !== cat)
      : [...filters.categories, cat];
    onFilterChange({ ...filters, categories: newCats });
  };

  const toggleBrand = (brand: string) => {
    const isSelected = filters.brands.includes(brand);
    const newBrands = isSelected
      ? filters.brands.filter(b => b !== brand)
      : [...filters.brands, brand];
    onFilterChange({ ...filters, brands: newBrands });
  };

  const toggleColor = (color: string) => {
    const isSelected = filters.colors.includes(color);
    const newColors = isSelected
      ? filters.colors.filter(c => c !== color)
      : [...filters.colors, color];
    onFilterChange({ ...filters, colors: newColors });
  };

  const hasActiveFilters =
    filters.departments.length > 0 ||
    filters.sizes.length > 0 ||
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.colors.length > 0 ||
    filters.maxPrice < 500;

  return (
    <aside className="w-full bg-white rounded-2xl border border-slate-100 p-5 shadow-soft space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-brand-primary" />
          <h3 className="font-bold text-slate-900 text-sm">Filtros do Catálogo</h3>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Limpar
          </button>
        )}
      </div>

      {/* Departamento */}
      <div>
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Boxes className="w-3.5 h-3.5 text-brand-primary" />
          Departamento
        </label>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {AVAILABLE_DEPARTMENTS.map(dept => {
            const isSelected = filters.departments.includes(dept);
            return (
              <button
                key={dept}
                type="button"
                onClick={() => toggleDepartment(dept)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-brand-primary text-white border-brand-primary shadow-xs ring-2 ring-brand-gold/30'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {dept}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tamanho / Numeração */}
      <div>
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
          Tamanho / Numeração
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {AVAILABLE_SIZES.map(size => {
            const isSelected = filters.sizes.includes(size);
            return (
              <button
                key={String(size)}
                type="button"
                onClick={() => toggleSize(size)}
                className={`h-8 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Categoria */}
      <div>
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
          Categoria
        </label>
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 text-xs">
          {AVAILABLE_CATEGORIES.map(cat => {
            const isSelected = filters.categories.includes(cat);
            return (
              <label
                key={cat}
                className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                  isSelected ? 'bg-emerald-50 text-brand-primary font-semibold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleCategory(cat)}
                  className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                />
                <span>{cat}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Marca */}
      <div>
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
          Marca
        </label>
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
          {availableBrands.map(brand => {
            const isSelected = filters.brands.includes(brand);
            return (
              <label
                key={brand}
                className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                  isSelected ? 'bg-emerald-50 text-brand-primary font-semibold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleBrand(brand)}
                  className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                />
                <span>{brand}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Cor */}
      <div>
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
          Cor
        </label>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {availableColors.map(color => {
            const isSelected = filters.colors.includes(color);
            return (
              <button
                key={color}
                type="button"
                onClick={() => toggleColor(color)}
                className={`px-2.5 py-1 rounded-full border text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-brand-primary text-white border-brand-primary font-semibold shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-brand-gold" />}
                <span>{color}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preço Máximo */}
      <div>
        <div className="flex items-center justify-between mb-2 text-xs">
          <label className="font-bold text-slate-800 uppercase tracking-wider">Preço Até</label>
          <span className="font-bold text-brand-primary">R$ {filters.maxPrice}</span>
        </div>
        <input
          type="range"
          min="50"
          max="1500"
          step="10"
          value={filters.maxPrice}
          onChange={(e) => onFilterChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full accent-brand-primary cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>R$ 50</span>
          <span>R$ 1.500</span>
        </div>
      </div>
    </aside>
  );
};
