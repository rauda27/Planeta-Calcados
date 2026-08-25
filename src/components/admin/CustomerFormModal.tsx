'use client';

import React, { useState, useEffect } from 'react';
import { Customer } from '../../types';
import { useStore } from '../../context/StoreContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { User, Phone, MapPin, CreditCard, FileText, CheckCircle2 } from 'lucide-react';

interface CustomerFormModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  customer,
  isOpen,
  onClose,
}) => {
  const { addCustomer, updateCustomer } = useStore();

  const [formData, setFormData] = useState({
    name: '',
    cpfCnpj: '',
    phone: '',
    mobile: '',
    email: '',
    address: '',
    bairro: '',
    city: 'Quatro Barras',
    uf: 'PR',
    cep: '83420-001',
    creditLimit: 1000,
    notes: '',
    status: 'active' as 'active' | 'blocked',
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        cpfCnpj: customer.cpfCnpj || '',
        phone: customer.phone || '',
        mobile: customer.mobile || '',
        email: customer.email || '',
        address: customer.address || '',
        bairro: customer.bairro || '',
        city: customer.city || 'Quatro Barras',
        uf: customer.uf || 'PR',
        cep: customer.cep || '83420-001',
        creditLimit: customer.creditLimit ?? 1000,
        notes: customer.notes || '',
        status: customer.status || 'active',
      });
    } else {
      setFormData({
        name: '',
        cpfCnpj: '',
        phone: '',
        mobile: '',
        email: '',
        address: '',
        bairro: '',
        city: 'Quatro Barras',
        uf: 'PR',
        cep: '83420-001',
        creditLimit: 1000,
        notes: '',
        status: 'active',
      });
    }
  }, [customer, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }

    if (!formData.cpfCnpj.trim()) {
      alert('Por favor, informe o CPF ou CNPJ do cliente.');
      return;
    }

    if (customer) {
      updateCustomer(customer.id, formData);
    } else {
      addCustomer(formData);
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? 'Editar Dados do Cliente' : 'Novo Cadastro de Cliente'}
      subtitle="Gerencie limites de crédito, contatos e dados para emissão de crediário"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identificação Básica */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-800 font-bold text-sm">
            <User className="w-4 h-4 text-brand-primary" />
            <span>Dados Pessoais / Identificação</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome Completo / Razão Social *
              </label>
              <Input
                type="text"
                required
                placeholder="Ex: Sandra Cristina dos Santos"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                CPF / CNPJ *
              </label>
              <Input
                type="text"
                required
                placeholder="000.000.000-00"
                value={formData.cpfCnpj}
                onChange={e => setFormData(prev => ({ ...prev, cpfCnpj: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Contato & WhatsApp */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-800 font-bold text-sm">
            <Phone className="w-4 h-4 text-brand-primary" />
            <span>Contato & Comunicação</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Celular / WhatsApp *
              </label>
              <Input
                type="text"
                required
                placeholder="(41) 99999-9999"
                value={formData.mobile}
                onChange={e => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Telefone Fixo
              </label>
              <Input
                type="text"
                placeholder="(41) 3672-0000"
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                E-mail
              </label>
              <Input
                type="email"
                placeholder="cliente@email.com"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-800 font-bold text-sm">
            <MapPin className="w-4 h-4 text-brand-primary" />
            <span>Endereço de Cobrança / Residencial</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Logradouro e Número
              </label>
              <Input
                type="text"
                placeholder="Ex: Av. Dom Pedro II, 96"
                value={formData.address}
                onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bairro
              </label>
              <Input
                type="text"
                placeholder="Centro"
                value={formData.bairro}
                onChange={e => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cidade
              </label>
              <Input
                type="text"
                value={formData.city}
                onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                UF
              </label>
              <Input
                type="text"
                maxLength={2}
                value={formData.uf}
                onChange={e => setFormData(prev => ({ ...prev, uf: e.target.value.toUpperCase() }))}
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                CEP
              </label>
              <Input
                type="text"
                value={formData.cep}
                onChange={e => setFormData(prev => ({ ...prev, cep: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Limite de Crédito e Status */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-800 font-bold text-sm">
            <CreditCard className="w-4 h-4 text-brand-primary" />
            <span>Condições Comerciais & Crediário</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Limite de Crédito / Promissória (R$)
              </label>
              <Input
                type="number"
                min="0"
                step="50"
                value={formData.creditLimit}
                onChange={e => setFormData(prev => ({ ...prev, creditLimit: Number(e.target.value) }))}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status do Cadastro
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'blocked' }))}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="active">Ativo (Permitir Vendas e Crediário)</option>
                <option value="blocked">Bloqueado (Restringir Vendas no Crediário)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observações / Histórico Interno
            </label>
            <textarea
              rows={2}
              placeholder="Anotações internas sobre o cliente, referências ou histórico..."
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
            {customer ? 'Salvar Alterações' : 'Cadastrar Cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
