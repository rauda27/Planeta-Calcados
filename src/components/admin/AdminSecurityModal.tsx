'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Shield, Key, CheckCircle, AlertCircle, Trash2, AlertTriangle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

interface AdminSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSecurityModal: React.FC<AdminSecurityModalProps> = ({ isOpen, onClose }) => {
  const { showToast, clearAllDataFromDatabase } = useStore();
  const [activeTab, setActiveTab] = useState<'owner' | 'staff' | 'danger'>('owner');

  // Owner Password Form
  const [newOwnerPass, setNewOwnerPass] = useState('');
  const [confirmOwnerPass, setConfirmOwnerPass] = useState('');

  // Staff PIN Form
  const [newStaffPin, setNewStaffPin] = useState('');
  const [confirmStaffPin, setConfirmStaffPin] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleUpdateOwnerPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newOwnerPass.length < 6) {
      setErrorMsg('A nova senha master deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newOwnerPass !== confirmOwnerPass) {
      setErrorMsg('A confirmação da nova senha não confere.');
      return;
    }

    try {
      const newHash = await sha256(newOwnerPass.trim());
      localStorage.setItem('planeta_owner_hash_pwd', newHash);
      setIsSuccess(true);
      showToast('Senha Master do Proprietário atualizada com sucesso!', 'success');
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1500);
    } catch (e) {
      setErrorMsg('Erro ao criptografar e salvar nova senha.');
    }
  };

  const handleUpdateStaffPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newStaffPin.length < 4) {
      setErrorMsg('O PIN de funcionário deve conter no mínimo 4 dígitos.');
      return;
    }

    if (newStaffPin !== confirmStaffPin) {
      setErrorMsg('A confirmação do PIN não confere.');
      return;
    }

    try {
      const newHash = await sha256(newStaffPin.trim());
      localStorage.setItem('planeta_staff_hash_pin', newHash);
      setIsSuccess(true);
      showToast('PIN de acesso dos colaboradores atualizado com sucesso!', 'success');
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1500);
    } catch (e) {
      setErrorMsg('Erro ao criptografar e salvar novo PIN.');
    }
  };

  const handleWipeDatabase = () => {
    const confirm = window.confirm(
      '⚠️ ATENÇÃO: Esta ação irá apagar TODOS os produtos, vendas e boletos do banco de dados na nuvem e local, zerando tudo para o início oficial.\n\nTem certeza que deseja zerar tudo?'
    );
    if (confirm) {
      clearAllDataFromDatabase();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Segurança & Gestão do Sistema"
      subtitle="Gerencie senhas, PIN de funcionários e manutenção do banco de dados"
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Role Tab Switcher */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl text-center">
          <button
            type="button"
            onClick={() => { setActiveTab('owner'); setErrorMsg(''); }}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'owner' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            👑 Senha Master
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('staff'); setErrorMsg(''); }}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'staff' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            👤 PIN Equipe
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('danger'); setErrorMsg(''); }}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'danger' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-600 hover:bg-rose-50'
            }`}
          >
            🧹 Zerar Tudo
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Credenciais criptografadas e salvas com sucesso!</span>
          </div>
        )}

        {activeTab === 'owner' && (
          <form onSubmit={handleUpdateOwnerPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nova Senha Master do Proprietário:
              </label>
              <input
                type="password"
                value={newOwnerPass}
                onChange={e => setNewOwnerPass(e.target.value)}
                placeholder="Digite a nova senha segura..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirmar Nova Senha Master:
              </label>
              <input
                type="password"
                value={confirmOwnerPass}
                onChange={e => setConfirmOwnerPass(e.target.value)}
                placeholder="Repita a nova senha..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-primary"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Salvar Nova Senha
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'staff' && (
          <form onSubmit={handleUpdateStaffPin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Novo PIN dos Colaboradores (Ex: 1234, 4321):
              </label>
              <input
                type="password"
                maxLength={8}
                value={newStaffPin}
                onChange={e => setNewStaffPin(e.target.value)}
                placeholder="Digite o novo PIN (4 a 8 dígitos)..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirmar Novo PIN:
              </label>
              <input
                type="password"
                maxLength={8}
                value={confirmStaffPin}
                onChange={e => setConfirmStaffPin(e.target.value)}
                placeholder="Repita o novo PIN..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-primary"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Salvar Novo PIN
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'danger' && (
          <div className="space-y-4 bg-rose-50/60 border border-rose-200 p-4 rounded-2xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-950 space-y-1">
                <h4 className="font-bold text-rose-900">Zerar e Limpar Todos os Dados</h4>
                <p className="text-rose-700">
                  Esta opção remove todos os produtos de teste, histórico de vendas e boletos tanto da Nuvem (Firebase) quanto da memória local, deixando a loja 100% zerada e pronta para o início real.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleWipeDatabase}
              className="w-full justify-center shadow-sm"
              icon={<Trash2 className="w-4 h-4" />}
            >
              Zerar Banco de Dados e Cadastros
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
