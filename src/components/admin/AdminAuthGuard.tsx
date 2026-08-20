'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Lock, Shield, Key, Eye, EyeOff, Store, UserCheck, Crown, ArrowRight, AlertCircle } from 'lucide-react';
import { StoreLogo } from '../ui/StoreLogo';
import { Button } from '../ui/Button';

// Senhas Oficiais Exclusivas
const OWNER_MASTER_PASS = 'Haja1315.';
const STAFF_ACCESS_PASS = 'Planeta01!';

// Helper to calculate SHA-256 cryptographic hash
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export type AuthRole = 'owner' | 'staff' | null;

interface AuthState {
  isAuthenticated: boolean;
  role: AuthRole;
  userName: string;
}

const AUTH_STORAGE_KEY = 'planeta_admin_auth_session';

export const getStoredAuthSession = (): AuthState => {
  if (typeof window === 'undefined') return { isAuthenticated: false, role: null, userName: '' };
  try {
    const session = sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY);
    if (session) {
      return JSON.parse(session);
    }
  } catch (e) {
    console.error(e);
  }
  return { isAuthenticated: false, role: null, userName: '' };
};

export const logoutAdminSession = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.location.reload();
  }
};

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export const AdminAuthGuard: React.FC<AdminAuthGuardProps> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false, role: null, userName: '' });
  const [isChecking, setIsChecking] = useState(true);

  // Form State
  const [selectedRole, setSelectedRole] = useState<'owner' | 'staff'>('owner');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const current = getStoredAuthSession();
    setAuth(current);
    setIsChecking(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const inputHash = await sha256(password.trim());
      const ownerTargetHash = await sha256(OWNER_MASTER_PASS);
      const staffTargetHash = await sha256(STAFF_ACCESS_PASS);

      if (selectedRole === 'owner') {
        if (inputHash === ownerTargetHash || password.trim() === OWNER_MASTER_PASS) {
          const authData: AuthState = {
            isAuthenticated: true,
            role: 'owner',
            userName: 'Proprietário / Gerente',
          };
          setAuth(authData);
          if (rememberMe) {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
          } else {
            sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
          }
          setIsLoading(false);
          return;
        }
      } else {
        if (inputHash === staffTargetHash || password.trim() === STAFF_ACCESS_PASS) {
          const authData: AuthState = {
            isAuthenticated: true,
            role: 'staff',
            userName: 'Operador / Vendedor',
          };
          setAuth(authData);
          if (rememberMe) {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
          } else {
            sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
          }
          setIsLoading(false);
          return;
        }
      }

      setErrorMsg('Senha incorreta. Verifique suas credenciais de acesso.');
    } catch (err) {
      setErrorMsg('Erro ao autenticar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Verificando credenciais de segurança...</p>
        </div>
      </div>
    );
  }

  // If already authenticated, render protected admin pages
  if (auth.isAuthenticated) {
    return <>{children}</>;
  }

  // Encrypted login portal
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-brand-primary/40 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-brand-gold/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6 animate-in zoom-in-95 duration-300">
        {/* Header with Brand & Lock Icon */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-gold to-amber-600 text-slate-950 shadow-gold mb-2">
            <Lock className="w-7 h-7" />
          </div>
          
          <StoreLogo variant="light" size="sm" className="justify-center" />
          
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-brand-gold text-[11px] font-bold mt-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Portal de Acesso Restrito ERP</span>
          </div>

          <p className="text-xs text-slate-400">
            Acesso exclusivo para proprietários e colaboradores autorizados.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => { setSelectedRole('owner'); setErrorMsg(''); setPassword(''); }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedRole === 'owner'
                ? 'bg-brand-primary text-white shadow-sm ring-1 ring-brand-gold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-4 h-4 text-brand-gold" />
            <span>Proprietário / Gerente</span>
          </button>

          <button
            type="button"
            onClick={() => { setSelectedRole('staff'); setErrorMsg(''); setPassword(''); }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedRole === 'staff'
                ? 'bg-brand-primary text-white shadow-sm ring-1 ring-brand-gold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4 text-brand-gold" />
            <span>Funcionário / Caixa</span>
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              {selectedRole === 'owner' ? 'Senha do Proprietário (Chefe):' : 'Senha dos Funcionários:'}
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Key className="w-4 h-4 text-brand-gold" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Digite a senha de acesso..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me Checkbox */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-brand-primary focus:ring-0 cursor-pointer"
              />
              <span>Lembrar login neste dispositivo</span>
            </label>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl flex items-center gap-2 text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="gold"
            size="lg"
            className="w-full justify-center shadow-gold font-bold"
            disabled={isLoading || !password.trim()}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Validando Acesso...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Desbloquear Painel ERP</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </form>

        {/* Footer Link back to Public Storefront */}
        <div className="pt-4 border-t border-slate-800/80 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-gold transition-colors"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Voltar para a Vitrine Pública da Loja</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
