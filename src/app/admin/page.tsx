'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Product } from '../../types';
import { AdminHeader, AdminTab } from '../../components/admin/AdminHeader';
import { AdminAuthGuard } from '../../components/admin/AdminAuthGuard';
import { InventoryTable } from '../../components/admin/InventoryTable';
import { ProductFormModal } from '../../components/admin/ProductFormModal';
import { FinancialDashboard } from '../../components/admin/FinancialDashboard';
import { BillsTable } from '../../components/admin/BillsTable';
import { BillFormModal } from '../../components/admin/BillFormModal';
import { StoreBannersModal } from '../../components/admin/StoreBannersModal';
import { POSModule } from '../../components/admin/POSModule';
import { CustomersSuppliersModule } from '../../components/admin/CustomersSuppliersModule';
import { DebtorsManagementModule } from '../../components/admin/DebtorsManagementModule';
import { Footer } from '../../components/footer';
import { useStore } from '../../context/StoreContext';

function AdminContent() {
  const { products } = useStore();
  const searchParams = useSearchParams();

  // Tab State: 'sales' | 'inventory' | 'cadastros' | 'devedores' | 'financial'
  const [activeERPTab, setActiveERPTab] = useState<AdminTab>('sales');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (
      tabParam === 'inventory' ||
      tabParam === 'financial' ||
      tabParam === 'sales' ||
      tabParam === 'cadastros' ||
      tabParam === 'devedores'
    ) {
      setActiveERPTab(tabParam as AdminTab);
    }
  }, [searchParams]);

  // Product Form Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Financial Filter & Modal State
  const [financialFilter, setFinancialFilter] = useState<'hoje' | 'proximos' | 'vencidos' | 'pagos' | 'todos'>('hoje');
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);

  // Banners Customizer Modal State
  const [isBannersModalOpen, setIsBannersModalOpen] = useState(false);

  const handleOpenProductModal = (product?: Product) => {
    setEditingProduct(product || null);
    setIsProductModalOpen(true);
  };

  const handleEditProductById = (productId: string) => {
    const target = products.find(p => p.id === productId);
    if (target) {
      setEditingProduct(target);
      setIsProductModalOpen(true);
    }
  };

  return (
    <AdminAuthGuard>
      <div className="min-h-screen flex flex-col bg-slate-50">
        {/* Sticky Admin Header */}
        <AdminHeader
          activeTab={activeERPTab}
          onTabChange={setActiveERPTab}
          onOpenBannersModal={() => setIsBannersModalOpen(true)}
        />

        {/* Main ERP Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 1. SALES & POS MODULE */}
          {activeERPTab === 'sales' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <POSModule />
            </div>
          )}

          {/* 2. INVENTORY MODULE */}
          {activeERPTab === 'inventory' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Inventory Table with Size Matrix */}
              <InventoryTable onOpenProductModal={handleOpenProductModal} />
            </div>
          )}

          {/* 3. CADASTROS MODULE (CLIENTES & FORNECEDORES) */}
          {activeERPTab === 'cadastros' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <CustomersSuppliersModule />
            </div>
          )}

          {/* 4. DEVEDORES & NOTAS PROMISSÓRIAS */}
          {activeERPTab === 'devedores' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <DebtorsManagementModule />
            </div>
          )}

          {/* 5. FINANCIAL MODULE */}
          {activeERPTab === 'financial' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Metric Cards & Filter Tabs */}
              <FinancialDashboard
                activeFilter={financialFilter}
                onFilterChange={setFinancialFilter}
                onOpenBillModal={() => setIsBillModalOpen(true)}
              />

              {/* Bills Table */}
              <BillsTable
                activeFilter={financialFilter}
                onOpenBillModal={() => setIsBillModalOpen(true)}
              />
            </div>
          )}
        </main>

        {/* Footer */}
        <Footer />

        {/* Product Registration Modal */}
        <ProductFormModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          editingProduct={editingProduct}
        />

        {/* Bill Registration Modal */}
        <BillFormModal
          isOpen={isBillModalOpen}
          onClose={() => setIsBillModalOpen(false)}
        />

        {/* Store Banners Customizer Modal */}
        <StoreBannersModal
          isOpen={isBannersModalOpen}
          onClose={() => setIsBannersModalOpen(false)}
        />
      </div>
    </AdminAuthGuard>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Carregando Painel ERP Planeta Calçados...</div>}>
      <AdminContent />
    </Suspense>
  );
}
