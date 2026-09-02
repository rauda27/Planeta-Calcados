'use client';

/**
 * ProductLabelModal — Central de Impressao de Etiquetas
 *
 * Impressora: Argox OS-214plus | 203 DPI (8 dots/mm)
 * Bobina:     3 Colunas | 35 mm x 30 mm por adesivo | 106 mm total
 *
 * Modos de impressao:
 *  1. QZ Tray  — envia PPLB direto para a impressora (SEM janela do Chrome)
 *  2. Navegador — abre janela do Chrome com SVG dimensionado em mm
 *  3. Folha A4  — grade de etiquetas em papel A4/PDF
 */

import React, { useState, useEffect } from 'react';
import { Product, ProductVariant } from '../../types';
import { useStore } from '../../context/StoreContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Barcode } from '../ui/Barcode';
import { encodeCode128 } from '../../lib/barcodeGenerator';
import { connectQZ, isQZConnected, findQZPrinters, printRawQZ, printImagesQZ } from '../../lib/qzTray';
import {
  Printer, Layers, LayoutGrid, Download, FileText, Wifi, WifiOff, Zap,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProductLabelModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

type QZStatus = 'idle' | 'connecting' | 'connected' | 'error';
type LabelItem = { product: Product; variant: ProductVariant; sku: string };

// ---------------------------------------------------------------------------
// Physical constants — Argox OS-214plus + 3-column 35x30mm / 33x22mm roll
// ---------------------------------------------------------------------------

const DOTS_PER_MM = 8;                          // 203 DPI (8 dots/mm)
const PAGE_W_MM   = 104;                        // Largura máxima da cabeça térmica Argox OS-214plus (104 mm)
const CANVAS_W    = 832;                        // 104 mm * 8 = 832 px
// Centros físicos das 3 colunas calibrados para o posicionamento real da bobina na Argox OS-214plus
const COL_CENTERS_BASE = [166, 446, 726];
const PPLB_COL_X_BASE  = [46, 326, 606];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ProductLabelModal: React.FC<ProductLabelModalProps> = ({
  product, isOpen, onClose,
}) => {
  const { products } = useStore();

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [variantPrintCounts, setVariantPrintCounts] = useState<Record<string, number>>({});
  const [showStoreName, setShowStoreName] = useState(true);
  const [showPrice, setShowPrice]         = useState(true);
  const [showLocation, setShowLocation]   = useState(true);

  // Calibration settings (para ajuste fino milimétrico se necessário)
  const [labelHeightMm, setLabelHeightMm] = useState<number>(30); // 30 mm padrão para etiquetas 35x30
  const [hOffsetMm, setHOffsetMm]         = useState<number>(0);  // ajuste horizontal em mm (-6 a +6)
  const [vOffsetMm, setVOffsetMm]         = useState<number>(0);  // ajuste vertical em mm (-4 a +4)
  const [showSetupGuide, setShowSetupGuide] = useState<boolean>(false);

  // QZ Tray
  const [qzStatus, setQzStatus]   = useState<QZStatus>('idle');
  const [qzPrinter, setQzPrinter] = useState<string>('');
  const [qzMessage, setQzMessage] = useState<string>('');

  const activeProduct =
    products.find(p => p.id === (selectedProductId || product?.id)) || product;

  const canvasHeight = Math.round(labelHeightMm * DOTS_PER_MM);

  useEffect(() => {
    if (product) {
      setSelectedProductId(product.id);
      const counts: Record<string, number> = {};
      product.variants.forEach(v => { counts[v.id] = Math.max(1, v.stock); });
      setVariantPrintCounts(counts);
    }
  }, [product, isOpen]);

  // Check QZ connection when modal opens
  useEffect(() => {
    if (isOpen && isQZConnected()) {
      setQzStatus('connected');
      if (!qzPrinter) {
        findQZPrinters('Argox').then(printers => {
          if (printers.length) {
            setQzPrinter(printers[0]);
            setQzMessage(`Conectado: ${printers[0]}`);
          }
        }).catch(() => {});
      }
    }
  }, [isOpen, qzPrinter]);

  if (!activeProduct) return null;

  const formatBRL = (val: number) =>
    `R$ ${Number(val || 0).toFixed(2).replace('.', ',')}`;

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const found = products.find(p => p.id === prodId);
    if (!found) return;
    const counts: Record<string, number> = {};
    found.variants.forEach(v => { counts[v.id] = Math.max(1, v.stock); });
    setVariantPrintCounts(counts);
  };

  const handleSetAllCounts = (mode: 'stock' | 'one' | 'zero') => {
    const updated: Record<string, number> = {};
    activeProduct.variants.forEach(v => {
      updated[v.id] = mode === 'stock' ? Math.max(0, v.stock) : mode === 'one' ? 1 : 0;
    });
    setVariantPrintCounts(updated);
  };

  const handleUpdateVariantCount = (variantId: string, count: number) =>
    setVariantPrintCounts(prev => ({ ...prev, [variantId]: Math.max(0, count) }));

  // -------------------------------------------------------------------------
  // Label list
  // -------------------------------------------------------------------------

  const labelsToPrint: LabelItem[] = [];
  activeProduct.variants.forEach(variant => {
    const count = variantPrintCounts[variant.id] || 0;
    for (let i = 0; i < count; i++)
      labelsToPrint.push({ product: activeProduct, variant, sku: activeProduct.sku || '26001' });
  });
  const totalLabels = labelsToPrint.length;

  // -------------------------------------------------------------------------
  // QZ Tray — Connect
  // -------------------------------------------------------------------------

  const handleQZConnect = async () => {
    setQzStatus('connecting');
    setQzMessage('Conectando ao QZ Tray...');
    try {
      await connectQZ();
      const printers = await findQZPrinters('Argox');
      if (!printers.length) {
        const all = await findQZPrinters('');
        setQzStatus('error');
        setQzMessage(
          `Impressora Argox nao encontrada. Disponiveis: ${all.join(', ') || 'nenhuma'}. `
          + 'Verifique o nome exato no Painel de Controle do Windows.'
        );
        return;
      }
      setQzPrinter(printers[0]);
      setQzStatus('connected');
      setQzMessage(`Conectado: ${printers[0]}`);
    } catch (err: any) {
      setQzStatus('error');
      setQzMessage(
        `Erro: ${err.message}. `
        + 'Verifique se o QZ Tray esta aberto (icone na bandeja do Windows).'
      );
    }
  };

  // -------------------------------------------------------------------------
  // QZ Tray — Gerador PPLB Nativo (3 Colunas)
  // -------------------------------------------------------------------------

  const generatePPLBRow = (row: (LabelItem | null)[]): string => {
    const clean = (s: string) =>
      (s || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9 .,:$/-]/g, '')
        .replace(/"/g, "'");

    let pplb = `N\nq832\nQ${canvasHeight},24\n`;

    PPLB_COL_X_BASE.forEach((cxBase, i) => {
      const item = row[i];
      if (!item) return;

      const cx = cxBase + Math.round(hOffsetMm * DOTS_PER_MM);
      const vy = Math.round(vOffsetMm * DOTS_PER_MM);
      const name  = clean(item.product.name.slice(0, 16).toUpperCase());
      const size  = clean(String(item.variant.size));
      const color = clean(item.variant.color.slice(0, 8).toUpperCase());
      const sku   = clean(item.sku);
      const price = clean(formatBRL(item.product.salePrice));
      const loc   = clean(
        item.variant.shelfLocation ? `LOC:${item.variant.shelfLocation}` : 'LOC:EST'
      );

      if (showStoreName) {
        pplb += `A${cx + 20},${40 + vy},0,2,1,1,N,"JOUMANA COMERCIO"\n`;
      }
      pplb += `A${cx + 8},${60 + vy},0,3,1,1,N,"${name}"\n`;
      pplb += `A${cx + 8},${80 + vy},0,4,1,1,N,"TAM: ${size}"\n`;
      pplb += `A${cx + 130},${80 + vy},0,2,1,1,N,"${color}"\n`;
      pplb += `B${cx + 8},${102 + vy},0,1,1,2,42,B,"${sku}"\n`;
      pplb += `A${cx + 50},${148 + vy},0,3,1,1,N,"${sku}"\n`;
      if (showLocation) {
        pplb += `A${cx + 8},${174 + vy},0,2,1,1,N,"${loc}"\n`;
      }
      if (showPrice) {
        pplb += `A${cx + 85},${168 + vy},0,5,1,1,N,"${price}"\n`;
      }
    });

    pplb += 'P1\n';
    return pplb;
  };

  // -------------------------------------------------------------------------
  // Renderizador Canvas 203 DPI (832x240 px) — Centralizado e com fontes ampliadas
  // -------------------------------------------------------------------------

  const renderRowToDataUrl = (row: (LabelItem | null)[]): string => {
    const canvas = document.createElement('canvas');
    canvas.width  = CANVAS_W;    // 832 px (104 mm — limite térmico físico Argox)
    canvas.height = canvasHeight; // 240 px (30 mm)
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_W, canvasHeight);

    const hOffsetPx = Math.round(hOffsetMm * DOTS_PER_MM);
    const vOffsetPx = Math.round(vOffsetMm * DOTS_PER_MM);
    const stickerUsableW = 212; // largura útil segura dentro de cada etiqueta (~26.5 mm)

    for (let col = 0; col < 3; col++) {
      const item = row[col];
      if (!item) continue;

      const colCenter = COL_CENTERS_BASE[col] + hOffsetPx;
      const innerX    = colCenter - stickerUsableW / 2;
      const rightEdge = colCenter + stickerUsableW / 2;
      const innerW    = stickerUsableW;

      let y = Math.max(2, 42 + vOffsetPx);

      // 1. Cabeçalho — Nome da Loja
      if (showStoreName) {
        ctx.fillStyle = '#000000';
        ctx.font = '900 11px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('JOUMANA COMÉRCIO', colCenter, y + 8);
        ctx.fillRect(innerX, y + 11, innerW, 1.2);
        y += 16;
      } else {
        y += 2;
      }

      // 2. Nome do Produto (Grande, destacado)
      ctx.fillStyle = '#000000';
      ctx.font = '900 13.5px Arial, sans-serif';
      ctx.textAlign = 'left';
      const name = item.product.name.length > 16
        ? item.product.name.slice(0, 15) + '…'
        : item.product.name;
      ctx.fillText(name.toUpperCase(), innerX, y + 11);
      y += 16;

      // 3. Tamanho e Cor (TAMANHO EXTRA GRANDE E DESTACADO)
      ctx.font = '900 17px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`TAM: ${item.variant.size}`, innerX, y + 14);

      ctx.font = '900 13px Arial, sans-serif';
      ctx.textAlign = 'right';
      const colorName = item.variant.color.length > 8
        ? item.variant.color.slice(0, 7) + '…'
        : item.variant.color;
      ctx.fillText(colorName.toUpperCase(), rightEdge, y + 13);
      y += 19;

      // 4. Código de Barras Code 128
      const binary   = encodeCode128(item.sku);
      const moduleW  = Math.min(1.22, (innerW - 6) / binary.length);
      const barcodeW = binary.length * moduleW;
      const barcodeX = colCenter - barcodeW / 2;
      const barcodeH = 42;

      ctx.fillStyle = '#000000';
      let bi = 0;
      while (bi < binary.length) {
        if (binary[bi] === '1') {
          let span = 0;
          const startBX = barcodeX + bi * moduleW;
          while (bi < binary.length && binary[bi] === '1') {
            span += moduleW;
            bi++;
          }
          ctx.fillRect(startBX, y, span, barcodeH);
        } else {
          bi++;
        }
      }
      y += barcodeH + 2;

      // Dígitos do SKU (CÓDIGO AMPLIADO, ESPAÇADO E EXTRA LEGÍVEL)
      ctx.font = '900 16px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(item.sku.split('').join('  '), colCenter, y + 12);
      y += 16;

      // Linha divisória
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(innerX, y, innerW, 1.2);
      y += 5;

      // 5. Rodapé: Localização + VALOR / PREÇO (VALOR EXTRA GRANDE E EM DESTAQUE)
      const locTxt = item.variant.shelfLocation
        ? `LOC: ${item.variant.shelfLocation}`
        : 'LOC: EST';

      if (showLocation) {
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(innerX, y, 62, 22);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.strokeRect(innerX, y, 62, 22);

        ctx.fillStyle = '#000000';
        ctx.font = '900 11px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(locTxt, innerX + 31, y + 15);
      }

      if (showPrice) {
        ctx.fillStyle = '#000000';
        ctx.font = '900 23px Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(formatBRL(item.product.salePrice), rightEdge, y + 18);
      }
    }

    return canvas.toDataURL('image/png');
  };

  // -------------------------------------------------------------------------
  // QZ Tray — Print (Envio contínuo linha a linha para não travar a Argox)
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // QZ Tray — Print (Envio contínuo carreira por carreira)
  // -------------------------------------------------------------------------

  const handleQZPrint = async (list: LabelItem[]) => {
    if (list.length === 0) { alert('Selecione pelo menos 1 etiqueta.'); return; }
    if (qzStatus !== 'connected') {
      alert('Conecte ao QZ Tray primeiro clicando no botão "Conectar QZ Tray".');
      return;
    }

    setQzMessage('Enviando para a impressora...');
    try {
      let targetPrinter = qzPrinter;
      if (!targetPrinter) {
        const found = await findQZPrinters('Argox');
        if (found.length) {
          targetPrinter = found[0];
          setQzPrinter(found[0]);
        } else {
          throw new Error('Impressora Argox não encontrada no Windows.');
        }
      }

      const rows: (LabelItem | null)[][] = [];
      for (let i = 0; i < list.length; i += 3) {
        const chunk = list.slice(i, i + 3);
        const fullRow: (LabelItem | null)[] = [
          chunk[0] || null,
          chunk[1] || null,
          chunk[2] || null,
        ];
        rows.push(fullRow);
      }

      const rowImages = rows.map(r => renderRowToDataUrl(r));

      // Envia todas as carreiras em um único trabalho de impressão:
      // 1. Pede permissão no QZ Tray apenas 1 vez (permissão geral)
      // 2. Não pula linhas em branco entre carreiras (impressão contínua)
      setQzMessage(`Enviando ${list.length} etiquetas (${rows.length} carreiras) para a impressora...`);
      await printImagesQZ(targetPrinter, rowImages, {
        widthMm: PAGE_W_MM,
        heightMm: labelHeightMm,
        rotation: 0,
      });

      setQzMessage(`Enviado com sucesso: ${list.length} etiqueta(s) em ${rows.length} carreira(s)!`);
    } catch (err: any) {
      setQzStatus('error');
      setQzMessage(`Erro ao imprimir: ${err.message}`);
    }
  };

  // -------------------------------------------------------------------------
  // Download PPLB (.prn)
  // -------------------------------------------------------------------------

  const handleDownloadPPLB = () => {
    const rows: (LabelItem | null)[][] = [];
    for (let i = 0; i < labelsToPrint.length; i += 3) {
      const chunk = labelsToPrint.slice(i, i + 3);
      rows.push([chunk[0] || null, chunk[1] || null, chunk[2] || null]);
    }
    let pplb = '';
    rows.forEach(row => {
      pplb += generatePPLBRow(row);
    });
    const blob = new Blob([pplb], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `etiquetas_${activeProduct.sku}.prn`;
    a.click(); URL.revokeObjectURL(url);
  };

  // -------------------------------------------------------------------------
  // Dispatch
  // -------------------------------------------------------------------------

  const handlePrint = (list: LabelItem[]) => {
    handleQZPrint(list);
  };

  const handleTest = () => {
    let test = labelsToPrint.slice(0, 3);
    if (test.length === 0) {
      const v = activeProduct.variants[0];
      if (!v) { alert('Produto sem variantes.'); return; }
      test = [v, v, v].map(variant => ({ product: activeProduct, variant, sku: activeProduct.sku || '26001' }));
    }
    while (test.length < 3) test.push(test[test.length - 1] || test[0]);
    handlePrint(test.slice(0, 3));
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Central de Impressão de Etiquetas — QZ Tray"
      subtitle={`Argox OS-214plus \u00b7 3 Colunas \u00b7 3,5 cm \u00d7 3,0 cm \u2014 ${activeProduct.name}`}
      maxWidth="3xl"
    >
      <div className="space-y-4">

        {/* ── 1. PRODUTO + PERFIL ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Produto Selecionado</label>
            <select
              value={activeProduct.id}
              onChange={e => handleProductChange(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold bg-white text-slate-900 shadow-sm"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (SKU: {p.sku}) &mdash; {formatBRL(p.salePrice)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Perfil da Impressora</label>
            <div className="p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Argox OS-214plus &middot; 3 Colunas</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                203 DPI (104 mm)
              </span>
            </div>
          </div>
        </div>

        {/* ── 2. PAINEL QZ TRAY (DIRETO) ───────────────────────────────── */}
        <div className={`rounded-xl border-2 p-3 transition-colors ${
          qzStatus === 'connected' ? 'bg-emerald-50 border-emerald-400'
          : qzStatus === 'error'   ? 'bg-red-50 border-red-400'
          : 'bg-slate-50 border-slate-300'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              {qzStatus === 'connected'
                ? <Wifi className="w-4 h-4 text-emerald-600" />
                : <WifiOff className="w-4 h-4 text-slate-400" />}
              <span className="text-xs font-bold text-slate-800">
                {qzStatus === 'idle'       && 'QZ Tray não conectado'}
                {qzStatus === 'connecting' && 'Conectando ao QZ Tray...'}
                {qzStatus === 'connected'  && `Conectado \u2014 ${qzPrinter || 'Argox OS-214plus'}`}
                {qzStatus === 'error'      && 'Erro de conexão com QZ Tray'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSetupGuide(!showSetupGuide)}
                className="text-[11px] font-bold text-slate-600 hover:underline cursor-pointer"
              >
                {showSetupGuide ? 'Ocultar Guia' : 'Guia Argox'}
              </button>
              {qzStatus !== 'connected' && (
                <button
                  type="button"
                  onClick={handleQZConnect}
                  disabled={qzStatus === 'connecting'}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {qzStatus === 'connecting' ? 'Aguarde...' : 'Conectar QZ Tray'}
                </button>
              )}
            </div>
          </div>

          {qzMessage && (
            <p className={`mt-1.5 text-[11px] font-medium ${
              qzStatus === 'error' ? 'text-red-700' : 'text-emerald-800'
            }`}>{qzMessage}</p>
          )}
        </div>

        {/* ── GUIA DE CALIBRAÇÃO ARGOX ─ */}
        {showSetupGuide && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3.5 text-xs text-amber-950 space-y-2">
            <div className="font-black uppercase text-amber-900 flex items-center gap-1.5">
              <span>Evitando Travamento da Luz Verde e Pulos de Linha na Argox OS-214plus</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[11px]">
              <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200">
                <div className="font-bold text-amber-900 mb-1">1. Driver do Windows (Para a luz não piscar):</div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                  <li>No Windows, abra <strong>Preferências de Impressão</strong> da Argox.</li>
                  <li>Aba <strong>Papel de etiquetas</strong> &rarr; Ação pós-impressão: <strong>Nenhum</strong>.</li>
                  <li>Tipo de Mídia: <strong>Intervalo entre etiquetas</strong> (Gap: 3,0 mm).</li>
                  <li>Aba <strong>Configuração de página</strong>: Tamanho = <strong>104,0 &times; 30,0 mm</strong>.</li>
                </ul>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200">
                <div className="font-bold text-amber-900 mb-1">2. Calibração Física do Sensor Gap:</div>
                <ol className="list-decimal list-inside space-y-0.5 text-slate-700">
                  <li>Desligue a Argox na chave traseira (0).</li>
                  <li>Mantenha o botão <strong>FEED</strong> (frente) pressionado.</li>
                  <li>Ligue a impressora mantendo o FEED pressionado.</li>
                  <li>Solte o FEED assim que os LEDs piscarem.</li>
                  <li>A impressora calibrará o tamanho exato dos adesivos!</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* ── 3. CALIBRAÇÃO FINA MILIMÉTRICA (HORIZONTAL & VERTICAL) ─── */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Altura da etiqueta */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700">Altura:</span>
              <div className="flex gap-1">
                {[28, 29, 30].map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setLabelHeightMm(h)}
                    className={`px-2 py-1 rounded text-[11px] font-bold border cursor-pointer ${
                      labelHeightMm === h
                        ? 'bg-brand-primary text-white border-brand-primary'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {h} mm {h === 30 ? '(Padrão)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Ajuste Horizontal */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700">Horizontal:</span>
              <button
                type="button"
                onClick={() => setHOffsetMm(prev => Math.max(-6, prev - 1))}
                className="w-6 h-6 bg-white border border-slate-300 rounded font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-sm"
                title="Deslocar para a esquerda"
              >
                &larr;
              </button>
              <span className="font-mono font-bold text-slate-900 min-w-[34px] text-center">
                {hOffsetMm > 0 ? `+${hOffsetMm}` : hOffsetMm} mm
              </span>
              <button
                type="button"
                onClick={() => setHOffsetMm(prev => Math.min(6, prev + 1))}
                className="w-6 h-6 bg-white border border-slate-300 rounded font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-sm"
                title="Deslocar para a direita"
              >
                &rarr;
              </button>
            </div>

            {/* Ajuste Vertical */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700">Vertical:</span>
              <button
                type="button"
                onClick={() => setVOffsetMm(prev => Math.max(-4, prev - 1))}
                className="w-6 h-6 bg-white border border-slate-300 rounded font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-sm"
                title="Subir impressão"
              >
                &uarr;
              </button>
              <span className="font-mono font-bold text-slate-900 min-w-[34px] text-center">
                {vOffsetMm > 0 ? `+${vOffsetMm}` : vOffsetMm} mm
              </span>
              <button
                type="button"
                onClick={() => setVOffsetMm(prev => Math.min(4, prev + 1))}
                className="w-6 h-6 bg-white border border-slate-300 rounded font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-sm"
                title="Descer impressão"
              >
                &darr;
              </button>
            </div>

            {(hOffsetMm !== 0 || vOffsetMm !== 0) && (
              <button
                type="button"
                onClick={() => { setHOffsetMm(0); setVOffsetMm(0); }}
                className="text-[10px] text-brand-primary font-bold hover:underline cursor-pointer"
              >
                Resetar Ajustes
              </button>
            )}
          </div>
        </div>

        {/* ── 4. PREVIA DOS 3 ADESIVOS ─────────────────────────────────── */}
        <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-brand-primary" />
              <span>Prévia dos 3 Adesivos na Bobina (3,5 &times; 3,0 cm &mdash; Preenchimento Total)</span>
            </div>
            <span className="text-[10px] text-slate-500">
              Código: <strong>{activeProduct.sku}</strong>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2.5 bg-slate-300/80 p-2.5 rounded-xl border border-slate-300">
            {[0, 1, 2].map(col => {
              const variant = activeProduct.variants[col] || activeProduct.variants[0];
              return (
                <div
                  key={col}
                  className="bg-white rounded-lg border border-slate-300 flex flex-col justify-between p-2.5 font-sans text-slate-900 shadow-sm"
                  style={{ aspectRatio: '35/30', minHeight: 180 }}
                >
                  {showStoreName && (
                    <div className="text-[9px] font-black text-center uppercase border-b-2 border-slate-900 pb-0.5 tracking-tight text-slate-900">
                      JOUMANA COMÉRCIO
                    </div>
                  )}
                  <div className="font-black text-xs uppercase leading-tight truncate text-slate-950 mt-1">
                    {activeProduct.name}
                  </div>
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="text-sm font-black text-slate-950">TAM: <strong className="text-base font-black text-slate-950">{variant?.size}</strong></span>
                    <span className="uppercase text-slate-800 truncate max-w-[65px] font-black text-xs">{variant?.color}</span>
                  </div>
                  <div className="flex justify-center py-0.5">
                    <Barcode value={activeProduct.sku || '26002'} height={40} moduleWidth={1.3} fontSize={12} />
                  </div>
                  <div className="flex justify-between items-end border-t border-slate-200 pt-1">
                    {showLocation && (
                      <span className="text-[9px] font-black bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 uppercase text-slate-800">
                        {variant?.shelfLocation ? `LOC: ${variant.shelfLocation}` : 'LOC: EST'}
                      </span>
                    )}
                    {showPrice && (
                      <span className="text-base font-black ml-auto text-slate-950">
                        {formatBRL(activeProduct.salePrice)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 5. QUANTIDADES ───────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-200">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-brand-primary" />
              Quantidades por Numeração / Variação
            </div>
            <div className="flex gap-1.5 text-[10px]">
              {(['stock', 'one', 'zero'] as const).map(m => (
                <button key={m} type="button" onClick={() => handleSetAllCounts(m)}
                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded cursor-pointer transition-colors">
                  {m === 'stock' ? 'Qtd Estoque' : m === 'one' ? '1 de Cada' : 'Zerar'}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-32 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] sticky top-0">
                <tr>
                  <th className="py-1.5 px-3">Tamanho</th>
                  <th className="py-1.5 px-3">Cor</th>
                  <th className="py-1.5 px-3">Estoque</th>
                  <th className="py-1.5 px-3">Local</th>
                  <th className="py-1.5 px-3 text-right">Etiquetas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeProduct.variants.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="py-1.5 px-3 font-bold text-slate-900">{v.size}</td>
                    <td className="py-1.5 px-3 text-slate-700 capitalize">{v.color}</td>
                    <td className="py-1.5 px-3 font-semibold text-slate-600">{v.stock} un</td>
                    <td className="py-1.5 px-3 text-[11px] text-slate-500">{v.shelfLocation || '\u2014'}</td>
                    <td className="py-1.5 px-3 text-right">
                      <input
                        type="number" min="0" max="999"
                        value={variantPrintCounts[v.id] || 0}
                        onChange={e => handleUpdateVariantCount(v.id, Number(e.target.value))}
                        className="w-14 border border-slate-300 rounded p-1 text-xs text-center font-bold bg-white text-slate-900"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-700 font-medium">
            {[
              { label: 'Nome da Loja',     state: showStoreName, setter: setShowStoreName },
              { label: 'Preço de Venda',   state: showPrice,     setter: setShowPrice     },
              { label: 'Local no Estoque', state: showLocation,  setter: setShowLocation  },
            ].map(({ label, state, setter }) => (
              <label key={label} className="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" checked={state} onChange={e => setter(e.target.checked)}
                  className="rounded text-brand-primary focus:ring-brand-primary" />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ── 6. AÇÕES ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Fechar</Button>
            <Button type="button" variant="outline" onClick={handleDownloadPPLB}
              icon={<Download className="w-3.5 h-3.5 text-slate-600" />}>
              Baixar .prn
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              className="border-emerald-600 text-emerald-800 hover:bg-emerald-50 text-xs font-bold"
              title="Imprime apenas 1 carreira (3 adesivos) para testar sem gastar bobina"
            >
              Testar 1 Linha (3 Adesivos)
            </Button>
            <Button
              type="button"
              variant="gold"
              onClick={() => handlePrint(labelsToPrint)}
              disabled={totalLabels === 0 || qzStatus !== 'connected'}
              icon={<Zap className="w-4 h-4 text-slate-950" />}
              className="shadow-gold px-5 font-bold"
            >
              Imprimir Todas ({totalLabels})
            </Button>
          </div>
        </div>

      </div>
    </Modal>
  );
};

