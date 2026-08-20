'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Product } from '../../types';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminAuthGuard } from '../../components/admin/AdminAuthGuard';
import { AdminSecurityModal } from '../../components/admin/AdminSecurityModal';
import { LowStockAlerts } from '../../components/admin/LowStockAlerts';
import { InventoryTable } from '../../components/admin/InventoryTable';
import { ProductFormModal } from '../../components/admin/ProductFormModal';
import { FinancialDashboard } from '../../components/admin/FinancialDashboard';
import { BillsTable } from '../../components/admin/BillsTable';
import { BillFormModal } from '../../components/admin/BillFormModal';
import { POSModule } from '../../components/admin/POSModule';
import { Footer } from '../../components/footer';
import { useStore } from '../../context/StoreContext';

function AdminContent() {
  const { products } = useStore();
  const searchParams = useSearchParams();

  // Tab State: 'sales' | 'inventory' | 'financial'
  const [activeERPTab, setActiveERPTab] = useState<'sales' | 'inventory' | 'financial'>('sales');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'inventory' || tabParam === 'financial' || tabParam === 'sales') {
      setActiveERPTab(tabParam);
    }
  }, [searchParams]);

  // Product Form Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Financial Filter & Modal State
  const [financialFilter, setFinancialFilter] = useState<'hoje' | 'proximos' | 'vencidos' | 'pagos' | 'todos'>('hoje');
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);

  // Security / Password Modal State
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

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
          onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        />

        {/* Main ERP Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* SALES & POS MODULE */}
          {activeERPTab === 'sales' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <POSModule />
            </div>
          )}

          {/* INVENTORY MODULE */}
          {activeERPTab === 'inventory' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Low Stock Urgent Alerts Banner */}
              <LowStockAlerts onEditProduct={handleEditProductById} />

              {/* Inventory Table with Size Matrix */}
              <InventoryTable onOpenProductModal={handleOpenProductModal} />
            </div>
          )}

          {/* FINANCIAL MODULE */}
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

        {/* Security & Password Modal */}
        <AdminSecurityModal
          isOpen={isSecurityModalOpen}
          onClose={() => setIsSecurityModalOpen(false)}
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
