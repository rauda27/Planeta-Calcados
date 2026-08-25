'use client';

import React, { useState } from 'react';
import { Customer, Supplier } from '../../types';
import { useStore } from '../../context/StoreContext';
import { CustomerFormModal } from './CustomerFormModal';
import { SupplierFormModal } from './SupplierFormModal';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import {
  Users,
  Building2,
  Plus,
  Search,
  Phone,
  MapPin,
  CreditCard,
  Edit2,
  Trash2,
  UserCheck,
  ShieldAlert,
  DollarSign,
  FileSpreadsheet,
} from 'lucide-react';

export const CustomersSuppliersModule: React.FC = () => {
  const { customers, suppliers, deleteCustomer, deleteSupplier } = useStore();

  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Filter Customers
  const filteredCustomers = customers.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.cpfCnpj && c.cpfCnpj.includes(q)) ||
      (c.mobile && c.mobile.includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q))
    );
  });

  // Filter Suppliers
  const filteredSuppliers = suppliers.filter(s => {
    const q = searchTerm.toLowerCase();
    return (
      (s.tradeName && s.tradeName.toLowerCase().includes(q)) ||
      (s.corporateName && s.corporateName.toLowerCase().includes(q)) ||
      (s.cnpjCpf && s.cnpjCpf.includes(q)) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q))
    );
  });

  const handleDeleteCustomer = (customer: Customer) => {
    if (confirm(`Tem certeza que deseja remover o cliente "${customer.name}"?`)) {
      deleteCustomer(customer.id);
    }
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    if (confirm(`Tem certeza que deseja remover o fornecedor "${supplier.tradeName}"?`)) {
      deleteSupplier(supplier.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tabs Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-primary" />
            <span>Módulo de Cadastros — Clientes & Fornecedores</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gerencie sua carteira de clientes, limites de crediário e catálogo de fornecedores da loja.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('customers');
              setSearchTerm('');
            }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-white text-slate-950 shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-brand-primary" />
            <span>Clientes ({customers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('suppliers');
              setSearchTerm('');
            }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'suppliers'
                ? 'bg-white text-slate-950 shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-amber-600" />
            <span>Fornecedores ({suppliers.length})</span>
          </button>
        </div>
      </div>

      {/* Action Bar (Search & New Button) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder={
              activeTab === 'customers'
                ? 'Buscar por nome, CPF ou WhatsApp...'
                : 'Buscar por fornecedor, CNPJ ou contato...'
            }
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 h-10 text-xs"
          />
        </div>

        {activeTab === 'customers' ? (
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              setEditingCustomer(null);
              setIsCustomerModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4 text-white" />}
          >
            Novo Cliente
          </Button>
        ) : (
          <Button
            type="button"
            variant="gold"
            onClick={() => {
              setEditingSupplier(null);
              setIsSupplierModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4 text-slate-950" />}
          >
            Novo Fornecedor
          </Button>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. ABA DE CLIENTES */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'customers' && (
        <Card className="p-0 overflow-hidden border-slate-200">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">Nenhum cliente cadastrado</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
                Cadastre seus clientes para registrar vendas na Nota Promissória, manter o histórico de compras e limites de crediário.
              </p>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setEditingCustomer(null);
                  setIsCustomerModalOpen(true);
                }}
                icon={<Plus className="w-4 h-4 text-white" />}
              >
                Cadastrar Primeiro Cliente
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <tr>
                    <th className="py-3 px-4">Cliente / CPF</th>
                    <th className="py-3 px-4">WhatsApp / Fone</th>
                    <th className="py-3 px-4">Localização / Cidade</th>
                    <th className="py-3 px-4 text-right">Limite de Crédito</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map(customer => (
                    <tr key={customer.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{customer.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          CPF/CNPJ: {customer.cpfCnpj || 'Não informado'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium">
                        <div className="text-emerald-700 font-semibold flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{customer.mobile || '—'}</span>
                        </div>
                        {customer.phone && (
                          <div className="text-[11px] text-slate-400">{customer.phone}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-800">{customer.city || 'Quatro Barras'} - {customer.uf || 'PR'}</div>
                        <div className="text-[11px] text-slate-400">{customer.address || '—'}</div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        R$ {Number(customer.creditLimit || 0).toFixed(2).replace('.', ',')}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            customer.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {customer.status === 'active' ? 'Ativo' : 'Bloqueado'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCustomer(customer);
                              setIsCustomerModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-brand-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Editar Cliente"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(customer)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Excluir Cliente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. ABA DE FORNECEDORES */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'suppliers' && (
        <Card className="p-0 overflow-hidden border-slate-200">
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">Nenhum fornecedor cadastrado</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
                Cadastre os fabricantes de calçados (ex: Beira Rio, Vizzano, Olympikus) para vincular aos produtos do estoque.
              </p>
              <Button
                type="button"
                variant="gold"
                onClick={() => {
                  setEditingSupplier(null);
                  setIsSupplierModalOpen(true);
                }}
                icon={<Plus className="w-4 h-4 text-slate-950" />}
              >
                Cadastrar Primeiro Fornecedor
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <tr>
                    <th className="py-3 px-4">Nome Fantasia / Razão Social</th>
                    <th className="py-3 px-4">CNPJ / CPF</th>
                    <th className="py-3 px-4">Contato / Representante</th>
                    <th className="py-3 px-4">Telefone Comercial</th>
                    <th className="py-3 px-4">Cidade / Polo</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSuppliers.map(supplier => (
                    <tr key={supplier.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{supplier.tradeName}</div>
                        {supplier.corporateName && (
                          <div className="text-[11px] text-slate-400">{supplier.corporateName}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        {supplier.cnpjCpf}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {supplier.contactPerson || '—'}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {supplier.phone || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {supplier.city ? `${supplier.city} - ${supplier.uf || 'PR'}` : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSupplier(supplier);
                              setIsSupplierModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-brand-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Editar Fornecedor"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSupplier(supplier)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Excluir Fornecedor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Customer Form Modal */}
      <CustomerFormModal
        customer={editingCustomer}
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setEditingCustomer(null);
        }}
      />

      {/* Supplier Form Modal */}
      <SupplierFormModal
        supplier={editingSupplier}
        isOpen={isSupplierModalOpen}
        onClose={() => {
          setIsSupplierModalOpen(false);
          setEditingSupplier(null);
        }}
      />
    </div>
  );
};
