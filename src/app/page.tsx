'use client';

import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, FilterState, ProductCategory } from '../types';
import { StoreHeader } from '../components/store/StoreHeader';
import { StoreHero } from '../components/store/StoreHero';
import { FilterSidebar } from '../components/store/FilterSidebar';
import { ProductGrid } from '../components/store/ProductGrid';
import { ProductDetailModal } from '../components/store/ProductDetailModal';
import { CartDrawer } from '../components/store/CartDrawer';
import { WhatsAppFloatingCTA } from '../components/store/WhatsAppFloatingCTA';
import { Footer } from '../components/footer';
import { Modal } from '../components/ui/Modal';

const INITIAL_FILTERS: FilterState = {
  search: '',
  departments: [],
  categories: [],
  brands: [],
  sizes: [],
  colors: [],
  maxPrice: 1500,
};

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative">
      <StoreHeader
        searchQuery={filters.search}
        onSearchChange={(q) => setFilters(prev => ({ ...prev, search: q }))}
        onToggleMobileFilter={() => setIsMobileFilterOpen(true)}
      />

      <StoreHero
        selectedCategory={selectedCategoryHero}
        onSelectCategory={(cat) => {
          setSelectedCategoryHero(cat);
          if (cat !== 'Todas') {
            setFilters(prev => ({ ...prev, categories: [] }));
          }
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      <Footer />

      {/* Floating Sticky WhatsApp Widget */}
      <WhatsAppFloatingCTA />

      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      <CartDrawer />

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
