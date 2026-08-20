'use client';

import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, FilterState, ProductCategory, Department } from '../types';
import { StoreHeader } from '../components/store/StoreHeader';
import { StoreHero } from '../components/store/StoreHero';
import { TrustBar } from '../components/store/TrustBar';
import { CategoryShowcase } from '../components/store/CategoryShowcase';
import { WhatsAppBannerCTA } from '../components/store/WhatsAppBannerCTA';
import { FilterSidebar } from '../components/store/FilterSidebar';
import { ProductGrid } from '../components/store/ProductGrid';
import { ProductDetailModal } from '../components/store/ProductDetailModal';
import { CartDrawer } from '../components/store/CartDrawer';
import { WhatsAppFloatingCTA } from '../components/store/WhatsAppFloatingCTA';
import { Footer } from '../components/footer';
import { Modal } from '../components/ui/Modal';
import { Footprints, Sparkles } from 'lucide-react';

const INITIAL_FILTERS: FilterState = {
  search: '',
  departments: [],
  categories: [],
  brands: [],
  sizes: [],
  colors: [],
  maxPrice: 1500,
};

const CATEGORIES_PILLS: (ProductCategory | 'Todas')[] = [
  'Todas',
  'Tênis',
  'Sapato Social',
  'Scarpin',
  'Rasteira',
  'Sandália',
  'Bota',
  'Polos',
  'Bonés',
  'Perfumes',
];

export default function StorePage() {
  const { products } = useStore();
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [selectedCategoryHero, setSelectedCategoryHero] = useState<ProductCategory | 'Todas'>('Todas');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const availableBrands = Array.from(new Set(products.map(p => p.brand)));
  const availableColors = Array.from(
    new Set(products.flatMap(p => p.variants.map(v => v.color)))
  );

  const filteredProducts = products.filter(product => {
    // 1. Search Query
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matches =
        product.name.toLowerCase().includes(q) ||
        product.brand.toLowerCase().includes(q) ||
        product.model.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        (product.department && product.department.toLowerCase().includes(q)) ||
        product.material.toLowerCase().includes(q);
      if (!matches) return false;
    }

    // 2. Department filter
    if (filters.departments.length > 0) {
      const dept = product.department || 'Calçados';
      if (!filters.departments.includes(dept)) {
        return false;
      }
    }

    // 3. Hero Category Pill
    if (selectedCategoryHero !== 'Todas' && product.category !== selectedCategoryHero) {
      return false;
    }

    // 4. Categories filter
    if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
      return false;
    }

    // 5. Brands filter
    if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
      return false;
    }

    // 6. Colors filter
    if (filters.colors.length > 0) {
      const hasMatchingColor = product.variants.some(v => filters.colors.includes(v.color));
      if (!hasMatchingColor) return false;
    }

    // 7. Sizes filter
    if (filters.sizes.length > 0) {
      const hasMatchingSize = product.variants.some(
        v => filters.sizes.map(String).includes(String(v.size)) && v.stock > 0
      );
      if (!hasMatchingSize) return false;
    }

    // 8. Max Price filter
    const effectivePrice = product.promoPrice || product.salePrice;
    if (effectivePrice > filters.maxPrice) {
      return false;
    }

    return true;
  });

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSelectedCategoryHero('Todas');
  };

  const handleSelectDepartment = (dept: Department) => {
    setFilters(prev => ({
      ...prev,
      departments: [dept],
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative">
      {/* Top Header with Search and Actions */}
      <StoreHeader
        searchQuery={filters.search}
        onSearchChange={(q) => setFilters(prev => ({ ...prev, search: q }))}
        onToggleMobileFilter={() => setIsMobileFilterOpen(true)}
      />

      {/* Main High-Converting Visual Hero Banner */}
      <StoreHero />

      {/* Trust & Advantages Bar */}
      <TrustBar />

      {/* Visual Category / Department Showcase Cards */}
      <CategoryShowcase onSelectDepartment={handleSelectDepartment} />

      {/* High-Converting Intermediate WhatsApp CTA Banner */}
      <WhatsAppBannerCTA />

      {/* Products Catalog Grid with Integrated Filters */}
      <main id="catalogo-grade" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Category Pills Bar (Positioned directly on top of the catalog) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full py-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1.5 mr-1">
              <Footprints className="w-4 h-4 text-brand-primary" />
              <span>Categorias:</span>
            </span>

            {CATEGORIES_PILLS.map(category => {
              const isSelected = selectedCategoryHero === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setSelectedCategoryHero(category);
                    if (category !== 'Todas') {
                      setFilters(prev => ({ ...prev, categories: [] }));
                    }
                  }}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-brand-primary text-white shadow-sm ring-2 ring-brand-gold/60'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Catalog Main Body */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-full lg:w-72 shrink-0 hidden lg:block sticky top-24">
            <FilterSidebar
              filters={filters}
              onFilterChange={setFilters}
              onResetFilters={handleResetFilters}
              availableBrands={availableBrands}
              availableColors={availableColors}
            />
          </div>

          <div className="flex-1 w-full min-w-0">
            <ProductGrid
              products={filteredProducts}
              onSelectProduct={(p) => setSelectedProduct(p)}
              onResetFilters={handleResetFilters}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Sticky WhatsApp Widget */}
      <WhatsAppFloatingCTA />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Quotation Cart Drawer */}
      <CartDrawer />

      {/* Mobile Filter Modal */}
      <Modal
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="Filtros do Catálogo"
        maxWidth="md"
      >
        <FilterSidebar
          filters={filters}
          onFilterChange={(newF) => {
            setFilters(newF);
            setIsMobileFilterOpen(false);
          }}
          onResetFilters={handleResetFilters}
          availableBrands={availableBrands}
          availableColors={availableColors}
        />
      </Modal>
    </div>
  );
}
