'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Image as ImageIcon, Upload, Save, RotateCcw, Sparkles, CheckCircle, Link as LinkIcon, Eye } from 'lucide-react';
import { useStore, DEFAULT_BANNERS } from '../../context/StoreContext';
import { StoreBanners } from '../../types';

// Helper: Compress and resize image file to optimized Base64
const compressBannerFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG 85%
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        resolve(compressedBase64);
      };
      img.onerror = err => reject(err);
    };
    reader.onerror = err => reject(err);
  });
};

interface StoreBannersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoreBannersModal: React.FC<StoreBannersModalProps> = ({ isOpen, onClose }) => {
  const { banners, updateBanners, resetBannersToDefault } = useStore();
  const [formBanners, setFormBanners] = useState<StoreBanners>(banners);
  const [isSaving, setIsSaving] = useState(false);

  // File input refs for each banner
  const heroRef = useRef<HTMLInputElement>(null);
  const femRef = useRef<HTMLInputElement>(null);
  const tenisRef = useRef<HTMLInputElement>(null);
  const mascRef = useRef<HTMLInputElement>(null);
  const acessoriosRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormBanners(banners);
  }, [banners, isOpen]);

  const handleFileUpload = async (field: keyof StoreBanners, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;

    try {
      const compressed = await compressBannerFile(file);
      setFormBanners(prev => ({
        ...prev,
        [field]: compressed,
      }));
    } catch (e) {
      console.error(e);
      alert('Erro ao carregar a imagem. Tente uma foto em formato JPG ou PNG.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateBanners(formBanners);
    setIsSaving(false);
    onClose();
  };

  const handleReset = async () => {
    const confirm = window.confirm('Deseja restaurar as imagens dos banners para o modelo padrão original?');
    if (confirm) {
      await resetBannersToDefault();
      setFormBanners(DEFAULT_BANNERS);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Personalizar Banners & Imagens da Loja"
      subtitle="Envie fotos direto do computador ou cole links para alterar os banners da página inicial"
      maxWidth="3xl"
    >
      <form onSubmit={handleSave} className="space-y-6">
        {/* Banner 1: Hero Principal */}
        <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-gold" />
                <span>1. Imagem Principal do Topo (Hero Banner)</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                A foto de destaque ao lado do título principal da loja.
              </p>
            </div>
            <button
              type="button"
              onClick={() => heroRef.current?.click()}
              className="px-3 py-1.5 bg-brand-primary text-white rounded-lg text-xs font-bold hover:bg-brand-primary/90 transition flex items-center gap-1 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Subir Foto do Computador</span>
            </button>
            <input
              ref={heroRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => handleFileUpload('heroBannerImage', e.target.files)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="w-full sm:w-40 h-28 rounded-xl overflow-hidden border-2 border-slate-300 bg-white shrink-0 shadow-xs relative">
              <img
                src={formBanners.heroBannerImage}
                alt="Hero Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 w-full space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600">Ou cole o link da imagem (URL):</label>
              <input
                type="url"
                value={formBanners.heroBannerImage}
                onChange={e => setFormBanners(prev => ({ ...prev, heroBannerImage: e.target.value }))}
                placeholder="https://..."
                className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Banners 2, 3, 4, 5: Categorias em Destaque */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            2. Banners dos 4 Blocos de Destaque da Loja
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Feminino */}
            <div className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">👠 Feminino & Scarpins</span>
                <button
                  type="button"
                  onClick={() => femRef.current?.click()}
                  className="text-[11px] font-bold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  Trocar Foto
                </button>
                <input
                  ref={femRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleFileUpload('femBannerImage', e.target.files)}
                />
              </div>
              <div className="h-24 rounded-lg overflow-hidden border bg-slate-100">
                <img src={formBanners.femBannerImage} alt="Fem" className="w-full h-full object-cover" />
              </div>
              <input
                type="url"
                value={formBanners.femBannerImage}
                onChange={e => setFormBanners(prev => ({ ...prev, femBannerImage: e.target.value }))}
                placeholder="URL da imagem..."
                className="w-full border border-slate-200 rounded p-1.5 text-[11px]"
              />
            </div>

            {/* Tênis */}
            <div className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">👟 Tênis & Esporte</span>
                <button
                  type="button"
                  onClick={() => tenisRef.current?.click()}
                  className="text-[11px] font-bold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  Trocar Foto
                </button>
                <input
                  ref={tenisRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleFileUpload('tenisBannerImage', e.target.files)}
                />
              </div>
              <div className="h-24 rounded-lg overflow-hidden border bg-slate-100">
                <img src={formBanners.tenisBannerImage} alt="Tenis" className="w-full h-full object-cover" />
              </div>
              <input
                type="url"
                value={formBanners.tenisBannerImage}
                onChange={e => setFormBanners(prev => ({ ...prev, tenisBannerImage: e.target.value }))}
                placeholder="URL da imagem..."
                className="w-full border border-slate-200 rounded p-1.5 text-[11px]"
              />
            </div>

            {/* Masculino */}
            <div className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">👞 Masculino & Social</span>
                <button
                  type="button"
                  onClick={() => mascRef.current?.click()}
                  className="text-[11px] font-bold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  Trocar Foto
                </button>
                <input
                  ref={mascRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleFileUpload('mascBannerImage', e.target.files)}
                />
              </div>
              <div className="h-24 rounded-lg overflow-hidden border bg-slate-100">
                <img src={formBanners.mascBannerImage} alt="Masc" className="w-full h-full object-cover" />
              </div>
              <input
                type="url"
                value={formBanners.mascBannerImage}
                onChange={e => setFormBanners(prev => ({ ...prev, mascBannerImage: e.target.value }))}
                placeholder="URL da imagem..."
                className="w-full border border-slate-200 rounded p-1.5 text-[11px]"
              />
            </div>

            {/* Acessórios & Perfumes */}
            <div className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">✨ Moda, Acessórios & Perfumes</span>
                <button
                  type="button"
                  onClick={() => acessoriosRef.current?.click()}
                  className="text-[11px] font-bold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  Trocar Foto
                </button>
                <input
                  ref={acessoriosRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleFileUpload('acessoriosBannerImage', e.target.files)}
                />
              </div>
              <div className="h-24 rounded-lg overflow-hidden border bg-slate-100">
                <img src={formBanners.acessoriosBannerImage} alt="Acessórios" className="w-full h-full object-cover" />
              </div>
              <input
                type="url"
                value={formBanners.acessoriosBannerImage}
                onChange={e => setFormBanners(prev => ({ ...prev, acessoriosBannerImage: e.target.value }))}
                placeholder="URL da imagem..."
                className="w-full border border-slate-200 rounded p-1.5 text-[11px]"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Restaurar Padrão
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="gold"
              size="sm"
              disabled={isSaving}
              icon={<Save className="w-4 h-4 text-slate-950" />}
            >
              {isSaving ? 'Salvando...' : 'Salvar Banners na Loja'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
