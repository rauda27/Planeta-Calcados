'use client';

import React, { useState, useEffect } from 'react';
import { Supplier } from '../../types';
import { useStore } from '../../context/StoreContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Building2, Phone, MapPin, CheckCircle2, User } from 'lucide-react';

interface SupplierFormModalProps {
  supplier: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
  supplier,
  isOpen,
  onClose,
}) => {
  const { addSupplier, updateSupplier } = useStore();

  const [formData, setFormData] = useState({
    tradeName: '',
    corporateName: '',
    cnpjCpf: '',
    phone: '',
    mobile: '',
    contactPerson: '',
    email: '',
    address: '',
    city: '',
    uf: 'PR',
    cep: '',
    notes: '',
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        tradeName: supplier.tradeName || '',
        corporateName: supplier.corporateName || '',
        cnpjCpf: supplier.cnpjCpf || '',
        phone: supplier.phone || '',
        mobile: supplier.mobile || '',
        contactPerson: supplier.contactPerson || '',
        email: supplier.email || '',
        address: supplier.address || '',
        city: supplier.city || '',
        uf: supplier.uf || 'PR',
        cep: supplier.cep || '',
        notes: supplier.notes || '',
      });
    } else {
      setFormData({
        tradeName: '',
        corporateName: '',
        cnpjCpf: '',
        phone: '',
        mobile: '',
        contactPerson: '',
        email: '',
        address: '',
        city: '',
        uf: 'PR',
        cep: '',
        notes: '',
      });
    }
  }, [supplier, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tradeName.trim()) {
      alert('Por favor, informe o Nome Fantasia ou Razão Social do fornecedor.');
      return;
    }

    if (!formData.cnpjCpf.trim()) {
      alert('Por favor, informe o CNPJ ou CPF do fornecedor.');
      return;
    }

    if (supplier) {
      updateSupplier(supplier.id, formData);
    } else {
      addSupplier(formData);
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={supplier ? 'Editar Fornecedor' : 'Novo Cadastro de Fornecedor'}
      subtitle="Cadastre fabricantes e distribuidores de calçados e vestuário"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Empresariais */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-800 font-bold text-sm">
            <Building2 className="w-4 h-4 text-brand-primary" />
            <span>Dados da Empresa</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome Fantasia / Marca Principal *
              </label>
              <Input
                type="text"
                required
                placeholder="Ex: Calçados Beira Rio S/A (Vizzano/Modare)"
                value={formData.tradeName}
                onChange={e => setFormData(prev => ({ ...prev, tradeName: e.target.value }))}
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                CNPJ / CPF *
              </label>
              <Input
                type="text"
                required
                placeholder="00.000.000/0001-00"
                value={formData.cnpjCpf}
                onChange={e => setFormData(prev => ({ ...prev, cnpjCpf: e.target.value }))}
              />
            </div>

            <div className="sm:col-span-12">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Razão Social Completa
              </label>
              <Input
                type="text"
                placeholder="Ex: Calçados Beira Rio Sociedade Anônima"
                value={formData.corporateName}
                onChange={e => setFormData(prev => ({ ...prev, corporateName: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Contato & Representante */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-800 font-bold text-sm">
            <User className="w-4 h-4 text-brand-primary" />
            <span>Contato & Representante Comercial</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome do Representante / Contato
              </label>
              <Input
                type="text"
                placeholder="Ex: Marcelo (Representante PR)"
                value={formData.contactPerson}
                onChange={e => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Telefone / WhatsApp Comercial
              </label>
              <Input
                type="text"
                placeholder="(41) 99999-9999"
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                E-mail para Pedidos / XML
              </label>
              <Input
                type="email"
                placeholder="pedidos@fabricante.com.br"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Endereço & Localização */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-800 font-bold text-sm">
            <MapPin className="w-4 h-4 text-brand-primary" />
            <span>Endereço da Fábrica / Distribuidor</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-6">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Endereço / Polo Fabril
              </label>
              <Input
                type="text"
                placeholder="Ex: Rodovia RS-239, Km 28"
                value={formData.address}
                onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cidade
              </label>
              <Input
                type="text"
                placeholder="Novo Hamburgo"
                value={formData.city}
                onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                UF
              </label>
              <Input
                type="text"
                maxLength={2}
                placeholder="RS"
                value={formData.uf}
                onChange={e => setFormData(prev => ({ ...prev, uf: e.target.value.toUpperCase() }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observações / Prazos de Faturamento
            </label>
            <textarea
              rows={2}
              placeholder="Condições comerciais especiais, pedido mínimo, dias de visita..."
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={<CheckCircle2 className="w-4 h-4 text-white" />}
          >
            {supplier ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
