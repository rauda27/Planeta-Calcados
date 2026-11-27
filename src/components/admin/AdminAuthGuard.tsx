'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Lock, Shield, Key, Eye, EyeOff, Store, UserCheck, Crown, ArrowRight, AlertCircle } from 'lucide-react';
import { StoreLogo } from '../ui/StoreLogo';
import { Button } from '../ui/Button';

// Hashes SHA-256 das senhas de acesso (as senhas em texto puro NUNCA devem ficar no codigo,
// pois todo este arquivo e enviado ao navegador). Para trocar uma senha, gere o hash com:
//   printf '%s' 'NovaSenha' | sha256sum
const OWNER_PASS_HASH = '6f37deb218ff0a0752c68bfc38d581f55d7021b2932868fd7954aa83f335a9d8';
const STAFF_PASS_HASH = '69f74972f969b676bc990210c666fbf08eb73366ed91bf47cecaafdefcca5450';

// Helper to calculate SHA-256 cryptographic hash
// Fallback em JS puro: crypto.subtle so existe em contexto seguro (HTTPS/localhost),
// entao acessos via http://IP-da-rede-local continuariam funcionando.
function sha256Fallback(bytes: Uint8Array): string {
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);
  const H = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const bitLen = bytes.length * 8;
  const padded = new Uint8Array(((bytes.length + 9 + 63) >> 6) << 6);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000));
  view.setUint32(padded.length - 4, bitLen >>> 0);
  const W = new Uint32Array(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) W[i] = view.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3);
      const s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = Array.from(H);
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const t1 = (h + S1 + ((e & f) ^ (~e & g)) + K[i] + W[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const t2 = (S0 + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
  }
  return Array.from(H).map(x => x.toString(16).padStart(8, '0')).join('');
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return sha256Fallback(msgBuffer);
  }
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

      if (selectedRole === 'owner') {
        if (inputHash === OWNER_PASS_HASH) {
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
        if (inputHash === STAFF_PASS_HASH) {
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
