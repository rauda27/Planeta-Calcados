'use client';

import React, { useState, useEffect } from 'react';
import { Product, ProductVariant } from '../../types';
import { useStore } from '../../context/StoreContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Barcode } from '../ui/Barcode';
import { generateBarcodeSVG } from '../../lib/barcodeGenerator';
import {
  Printer,
  Barcode as BarcodeIcon,
  Tag,
  MapPin,
  CheckSquare,
  Square,
  Layers,
  FileText,
  Sliders,
  DollarSign,
  Grid3X3,
  AlertCircle,
  RotateCw,
  Sparkles,
  RefreshCw,
  LayoutGrid,
} from 'lucide-react';

interface ProductLabelModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export type LabelFormat =
  | 'argox_3col_34x30'
  | 'single_34x30'
  | 'thermal_50x30'
  | 'thermal_60x40'
  | 'a4_pimaco_30'
  | 'thermal_elgin_80';

export type RotationAngle = '0' | '90' | '270' | '180';

export const ProductLabelModal: React.FC<ProductLabelModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { products } = useStore();

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [labelFormat, setLabelFormat] = useState<LabelFormat>('argox_3col_34x30');
  const [rotation, setRotation] = useState<RotationAngle>('0');
  
  // Quantities to print per variant id: { [variantId]: number }
  const [variantPrintCounts, setVariantPrintCounts] = useState<Record<string, number>>({});

  // Display toggles on label
  const [showStoreName, setShowStoreName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showLocation, setShowLocation] = useState(true);

  // Active product
  const activeProduct = products.find(p => p.id === (selectedProductId || product?.id)) || product;

  useEffect(() => {
    if (product) {
      setSelectedProductId(product.id);
      const initialCounts: Record<string, number> = {};
      product.variants.forEach(v => {
        initialCounts[v.id] = Math.max(1, v.stock);
      });
      setVariantPrintCounts(initialCounts);
    }
  }, [product, isOpen]);

  if (!activeProduct) return null;

  const formatBRL = (val: number) => `R$ ${Number(val || 0).toFixed(2).replace('.', ',')}`;

  // Handle switching product
  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const found = products.find(p => p.id === prodId);
    if (found) {
      const initialCounts: Record<string, number> = {};
      found.variants.forEach(v => {
        initialCounts[v.id] = Math.max(1, v.stock);
      });
      setVariantPrintCounts(initialCounts);
    }
  };

  const handleSetAllCounts = (mode: 'stock' | 'one' | 'zero') => {
    const updated: Record<string, number> = {};
    activeProduct.variants.forEach(v => {
      if (mode === 'stock') updated[v.id] = Math.max(0, v.stock);
      else if (mode === 'one') updated[v.id] = 1;
      else updated[v.id] = 0;
    });
    setVariantPrintCounts(updated);
  };

  const handleUpdateVariantCount = (variantId: string, count: number) => {
    setVariantPrintCounts(prev => ({
      ...prev,
      [variantId]: Math.max(0, count),
    }));
  };

  // Compile list of all labels to print (Barcode is strictly the product SKU, e.g. 26002)
  const labelsToPrint: {
    product: Product;
    variant: ProductVariant;
    barcodeValue: string;
  }[] = [];

  activeProduct.variants.forEach(variant => {
    const count = variantPrintCounts[variant.id] || 0;
    const barcodeVal = activeProduct.sku || '26001';
    for (let i = 0; i < count; i++) {
      labelsToPrint.push({
        product: activeProduct,
        variant,
        barcodeValue: barcodeVal,
      });
    }
  });

  const totalLabels = labelsToPrint.length;

  // Execute Direct Printing
  const executePrint = (labelsList: typeof labelsToPrint) => {
    if (labelsList.length === 0) {
      alert('Selecione pelo menos 1 etiqueta para imprimir.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      window.print();
      return;
    }

    const is3Col = labelFormat === 'argox_3col_34x30';

    let pagesHtml = '';

    if (is3Col) {
      // Group labels into Rows of 3 (1 Page = 1 Row of 3 stickers)
      const rows: (typeof labelsList)[] = [];
      for (let i = 0; i < labelsList.length; i += 3) {
        rows.push(labelsList.slice(i, i + 3));
      }

      rows.forEach(row => {
        pagesHtml += `<table class="argox-row-table" cellspacing="0" cellpadding="0"><tbody><tr>`;

        // Col 1 (Left), Col 2 (Middle), Col 3 (Right)
        for (let colIdx = 0; colIdx < 3; colIdx++) {
          const item = row[colIdx];
          if (item) {
            const barcodeSvg = generateBarcodeSVG(item.barcodeValue, {
              height: 18,
              moduleWidth: 1.0,
              showText: true,
              fontSize: 8,
            });

            const locationText = item.variant.shelfLocation
              ? `LOC: ${item.variant.shelfLocation}`
              : 'LOC: ESTOQUE';

            const priceText = formatBRL(item.product.salePrice);

            pagesHtml += `
              <td class="col-sticker">
                <div class="sticker-inner rot-${rotation}">
                  ${showStoreName ? '<div class="store-name">PLANETA CALÇADOS</div>' : ''}
                  <div class="prod-title">${item.product.name}</div>
                  <div class="meta-row">
                    <span class="tam-badge">TAM: <strong>${item.variant.size}</strong></span>
                    <span class="color-text">${item.variant.color}</span>
                  </div>
                  <div class="barcode-wrapper">${barcodeSvg}</div>
                  <div class="bottom-row">
                    ${showLocation ? `<span class="loc-tag">${locationText}</span>` : '<span></span>'}
                    ${showPrice ? `<span class="price-tag">${priceText}</span>` : ''}
                  </div>
                </div>
              </td>
            `;
          } else {
            // Empty placeholder sticker cell to preserve columns
            pagesHtml += `<td class="col-sticker col-blank"><div class="sticker-inner"></div></td>`;
          }
        }

        pagesHtml += `</tr></tbody></table>`;
      });
    } else {
      // Single column or standard layouts
      labelsList.forEach(item => {
        const barcodeSvg = generateBarcodeSVG(item.barcodeValue, {
          height: labelFormat === 'single_34x30' ? 18 : 30,
          moduleWidth: 1.1,
          showText: true,
          fontSize: 8.5,
        });

        const locationText = item.variant.shelfLocation
          ? `LOC: ${item.variant.shelfLocation}`
          : 'LOC: ESTOQUE';

        const priceText = formatBRL(item.product.salePrice);

        pagesHtml += `
          <div class="single-sticker-box rot-${rotation}">
            ${showStoreName ? '<div class="store-name">PLANETA CALÇADOS</div>' : ''}
            <div class="prod-title">${item.product.name}</div>
            <div class="meta-row">
              <span class="tam-badge">TAM: <strong>${item.variant.size}</strong></span>
              <span class="color-text">${item.variant.color}</span>
            </div>
            <div class="barcode-wrapper">${barcodeSvg}</div>
            <div class="bottom-row">
              ${showLocation ? `<span class="loc-tag">${locationText}</span>` : '<span></span>'}
              ${showPrice ? `<span class="price-tag">${priceText}</span>` : ''}
            </div>
          </div>
        `;
      });
    }

    const printCss = `
      @charset "UTF-8";
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body {
        font-family: Arial, Helvetica, sans-serif;
        color: #000000;
        background: #ffffff;
        margin: 0 !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .store-name { font-size: 7px; font-weight: 900; text-transform: uppercase; text-align: center; letter-spacing: 0.2px; border-bottom: 0.5px solid #000; padding-bottom: 0.5px; margin-bottom: 1px; }
      .prod-title { font-size: 7.5px; font-weight: 700; text-transform: uppercase; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; }
      .meta-row { display: flex; justify-content: space-between; font-size: 7px; font-weight: 600; margin-top: 0.5px; }
      .tam-badge { font-size: 8px; font-weight: 900; }
      .color-text { text-transform: capitalize; font-size: 7px; }
      .barcode-wrapper { margin: 0.5px 0; display: flex; justify-content: center; overflow: hidden; }
      .barcode-wrapper svg { max-width: 100%; height: auto; display: block; margin: 0 auto; }
      .bottom-row { display: flex; justify-content: space-between; align-items: flex-end; font-size: 7px; margin-top: 0.5px; }
      .price-tag { font-size: 9.5px; font-weight: 900; }
      .loc-tag { font-size: 6.5px; font-weight: 700; background: #f0f0f0; padding: 0.5px 1.5px; border-radius: 1px; border: 0.5px solid #bbb; }

      /* Rotation Classes */
      .rot-0 { transform: none; }
      .rot-90 {
        transform: rotate(90deg);
        transform-origin: center center;
      }
      .rot-270 {
        transform: rotate(270deg);
        transform-origin: center center;
      }
      .rot-180 {
        transform: rotate(180deg);
        transform-origin: center center;
      }

      /* ======================================================== */
      /* 1. ARGOX OS-214plus: 3 COLUNAS LADO A LADO EM 104mm x 30mm */
      /* ======================================================== */
      ${
        is3Col
          ? `
        @page {
          size: 104mm 30mm;
          margin: 0mm !important;
        }
        .argox-row-table {
          width: 104mm !important;
          max-width: 104mm !important;
          min-width: 104mm !important;
          height: 30mm !important;
          max-height: 30mm !important;
          min-height: 30mm !important;
          table-layout: fixed !important;
          border-collapse: collapse !important;
          page-break-after: always !important;
          page-break-inside: avoid !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .col-sticker {
          width: 34.6mm !important;
          max-width: 34.6mm !important;
          min-width: 34.6mm !important;
          height: 30mm !important;
          max-height: 30mm !important;
          vertical-align: middle !important;
          padding: 0.5mm 1mm !important;
          border: none !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          text-align: center !important;
        }
        .sticker-inner {
          width: 33mm;
          height: 28.5mm;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          margin: 0 auto;
        }
        .col-blank {
          visibility: hidden !important;
        }
      `
          : ''
      }

      /* 2. Etiqueta Unitária 34x30mm */
      ${
        labelFormat === 'single_34x30'
          ? `
        @page { size: 34mm 30mm; margin: 0 !important; }
        .single-sticker-box {
          width: 34mm;
          height: 30mm;
          padding: 1mm 1.2mm;
          page-break-after: always;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          margin: 0 auto;
        }
      `
          : ''
      }

      /* 3. Etiqueta 50x30mm */
      ${
        labelFormat === 'thermal_50x30'
          ? `
        @page { size: 50mm 30mm; margin: 0 !important; }
        .single-sticker-box {
          width: 50mm;
          height: 30mm;
          padding: 1.5mm 2mm;
          page-break-after: always;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
        }
      `
          : ''
      }

      /* 4. Etiqueta 60x40mm */
      ${
        labelFormat === 'thermal_60x40'
          ? `
        @page { size: 60mm 40mm; margin: 0 !important; }
        .single-sticker-box {
          width: 60mm;
          height: 40mm;
          padding: 2mm 3mm;
          page-break-after: always;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
        }
      `
          : ''
      }

      /* 5. A4 Pimaco 30 etiquetas */
      ${
        labelFormat === 'a4_pimaco_30'
          ? `
        @page { size: A4 portrait; margin: 10mm 5mm !important; }
        .labels-container {
          display: grid;
          grid-template-columns: repeat(3, 66.7mm);
          grid-auto-rows: 25.4mm;
          gap: 2mm 3mm;
        }
        .single-sticker-box {
          width: 66.7mm;
          height: 25.4mm;
          padding: 1.5mm 2mm;
          border: 0.5px dashed #ccc;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          page-break-inside: avoid;
        }
      `
          : ''
      }

      /* 6. Elgin i9 80mm */
      ${
        labelFormat === 'thermal_elgin_80'
          ? `
        @page { size: 80mm auto; margin: 0 !important; }
        .labels-container { width: 76mm; margin: 0 auto; padding: 2mm 0; }
        .single-sticker-box {
          width: 76mm;
          padding: 3mm 2mm;
          border-bottom: 1px dashed #000;
          margin-bottom: 3mm;
          display: flex;
          flex-direction: column;
          page-break-inside: avoid;
        }
      `
          : ''
      }
    `;

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Etiquetas Argox - ${activeProduct.name}</title>
          <style>${printCss}</style>
        </head>
        <body>
          <div class="labels-container">
            ${pagesHtml}
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() { window.close(); }, 600);
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleTestPrint3Labels = () => {
    // Take only the first 3 labels (1 row)
    const testList = labelsToPrint.slice(0, 3);
    if (testList.length === 0) {
      testList.push({
        product: activeProduct,
        variant: activeProduct.variants[0] || {
          id: 'v_test',
          color: 'Bege',
          size: 40,
          stock: 1,
        },
        barcodeValue: activeProduct.sku || '26002',
      });
    }
    executePrint(testList);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Impressão de Etiquetas com Código de Barras"
      subtitle={`Etiquetas 34x30mm (3 Colunas / Argox OS-214plus) — ${activeProduct.name}`}
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Top Product Selector & Print Format Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Produto Selecionado
            </label>
            <select
              value={activeProduct.id}
              onChange={e => handleProductChange(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold bg-white text-slate-900 focus:ring-2 focus:ring-brand-primary"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (SKU: {p.sku}) — {formatBRL(p.salePrice)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Formato da Etiqueta
            </label>
            <select
              value={labelFormat}
              onChange={e => setLabelFormat(e.target.value as LabelFormat)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold bg-white text-slate-900 focus:ring-2 focus:ring-brand-primary"
            >
              <option value="argox_3col_34x30">
                ⭐ 3 Colunas 34x30mm (Argox OS-214plus / Rolo 106mm)
              </option>
              <option value="single_34x30">
                🏷️ 1 por 1 (Argox configurada com página 34x30mm)
              </option>
              <option value="thermal_50x30">
                🏷️ Rolo 50x30mm (1 Coluna)
              </option>
              <option value="thermal_60x40">
                🏷️ Rolo 60x40mm (Gôndola)
              </option>
              <option value="a4_pimaco_30">
                📄 Folha A4 Adesiva Pimaco (30 etiquetas por folha)
              </option>
              <option value="thermal_elgin_80">
                🧾 Bobina Elgin i9 80mm
              </option>
            </select>
          </div>
        </div>

        {/* Orientation Selector Buttons Bar */}
        <div className="bg-slate-900 text-white p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold">
            <RotateCw className="w-4 h-4 text-brand-gold" />
            <span>Giro da Impressão (Ajuste para Argox):</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => setRotation('0')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                rotation === '0' ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              0° (Normal)
            </button>
            <button
              type="button"
              onClick={() => setRotation('270')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                rotation === '270' ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Giro de -90 graus para desvirar etiquetas saindo de lado"
            >
              -90° (Desvirar)
            </button>
            <button
              type="button"
              onClick={() => setRotation('90')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                rotation === '90' ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              +90°
            </button>
            <button
              type="button"
              onClick={() => setRotation('180')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                rotation === '180' ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              180°
            </button>
          </div>
        </div>

        {/* Live 3-Column Preview (Showing all 3 stickers side-by-side) */}
        <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-brand-primary" />
              <span>Prévia: 3 Etiquetas Lado a Lado (Carreira Tripla 34x30mm)</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              Giro atual: <strong>{rotation}°</strong> • SKU: <strong>{activeProduct.sku}</strong>
            </span>
          </div>

          {/* 3 Stickers Container */}
          <div className="grid grid-cols-3 gap-2 max-w-2xl mx-auto bg-slate-200 p-2.5 rounded-xl border border-slate-300">
            {[1, 2, 3].map(col => {
              const variant = activeProduct.variants[col - 1] || activeProduct.variants[0];
              return (
                <div
                  key={col}
                  className={`bg-white rounded-lg p-2.5 shadow-sm border border-slate-300 text-left font-sans text-slate-900 space-y-1 transition-transform duration-200 ${
                    rotation === '90'
                      ? 'rotate-90 scale-90 my-3'
                      : rotation === '270'
                      ? '-rotate-90 scale-90 my-3'
                      : rotation === '180'
                      ? 'rotate-180'
                      : ''
                  }`}
                >
                  {showStoreName && (
                    <div className="text-[8px] font-black text-center uppercase border-b border-slate-300 pb-0.5 tracking-tight text-slate-900">
                      PLANETA CALÇADOS
                    </div>
                  )}
                  <div className="font-extrabold text-[9.5px] uppercase leading-tight text-slate-900 truncate">
                    {activeProduct.name}
                  </div>
                  <div className="flex justify-between text-[8.5px] font-semibold text-slate-700">
                    <span>
                      TAM: <strong className="text-slate-950 font-black">{variant?.size || 40}</strong>
                    </span>
                    <span className="capitalize text-slate-600 truncate max-w-[50px]">
                      {variant?.color || 'bege'}
                    </span>
                  </div>

                  {/* Barcode only for Product Code / SKU (ex: 26002) */}
                  <div className="py-0.5 flex justify-center">
                    <Barcode
                      value={activeProduct.sku || '26002'}
                      height={18}
                      moduleWidth={0.95}
                      fontSize={8}
                    />
                  </div>

                  <div className="flex justify-between items-end pt-0.5 border-t border-slate-100">
                    {showLocation && (
                      <span className="text-[7px] font-bold bg-slate-100 px-1 py-0.5 rounded border border-slate-200 text-slate-700 uppercase">
                        {variant?.shelfLocation ? `LOC: ${variant.shelfLocation}` : 'LOC: EST'}
                      </span>
                    )}
                    {showPrice && (
                      <span className="text-[10px] font-black text-slate-950 ml-auto">
                        {formatBRL(activeProduct.salePrice)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quantities Selector & Toggles */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-200">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-brand-primary" />
              <span>Quantidades por Numeração / Variação</span>
            </div>

            {/* Quick Fill Buttons */}
            <div className="flex gap-1.5 text-[10px]">
              <button
                type="button"
                onClick={() => handleSetAllCounts('stock')}
                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded cursor-pointer"
                title="Imprimir 1 etiqueta para cada item atualmente em estoque"
              >
                Qtd Estoque
              </button>
              <button
                type="button"
                onClick={() => handleSetAllCounts('one')}
                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded cursor-pointer"
                title="1 de cada tamanho"
              >
                1 de Cada
              </button>
              <button
                type="button"
                onClick={() => handleSetAllCounts('zero')}
                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded cursor-pointer"
              >
                Zerar
              </button>
            </div>
          </div>

          {/* Table of Variants & Counts */}
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] sticky top-0">
                <tr>
                  <th className="py-2 px-3">Tamanho</th>
                  <th className="py-2 px-3">Cor</th>
                  <th className="py-2 px-3">Em Estoque</th>
                  <th className="py-2 px-3">Localização</th>
                  <th className="py-2 px-3 text-right">Etiquetas a Imprimir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeProduct.variants.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-slate-900">{v.size}</td>
                    <td className="py-2 px-3 text-slate-700 capitalize">{v.color}</td>
                    <td className="py-2 px-3 font-semibold text-slate-600">{v.stock} un</td>
                    <td className="py-2 px-3 text-[11px] text-slate-500">
                      {v.shelfLocation || '—'}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        max="999"
                        value={variantPrintCounts[v.id] || 0}
                        onChange={e => handleUpdateVariantCount(v.id, Number(e.target.value))}
                        className="w-16 border border-slate-300 rounded p-1 text-xs text-center font-bold bg-white text-slate-900"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Customization Toggles */}
          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-700 font-medium">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showStoreName}
                onChange={e => setShowStoreName(e.target.checked)}
                className="rounded text-brand-primary focus:ring-brand-primary"
              />
              <span>Nome da Loja</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showPrice}
                onChange={e => setShowPrice(e.target.checked)}
                className="rounded text-brand-primary focus:ring-brand-primary"
              />
              <span>Preço de Venda</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showLocation}
                onChange={e => setShowLocation(e.target.checked)}
                className="rounded text-brand-primary focus:ring-brand-primary"
              />
              <span>Local no Estoque (Prateleira)</span>
            </label>
          </div>
        </div>

        {/* Argox OS-214plus Setup Instructions Banner */}
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-950 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1 text-[11px]">
            <div className="font-black text-amber-900 uppercase">
              Como imprimir 3 etiquetas lado a lado na Argox OS-214plus:
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-amber-900">
              <li>
                Clique em <strong>🧪 Testar 1 Linha (3 Etiquetas)</strong> para imprimir 1 carreira com 3 etiquetas lado a lado.
              </li>
              <li>
                Na janela do navegador: <strong>Margens: Nenhuma (0mm)</strong> e <strong>Desmarque "Cabeçalhos e rodapés"</strong>.
              </li>
              <li>
                Se a sua impressora estiver rotacionando o texto, selecione o botão <strong>-90° (Desvirar)</strong> na barra preta de Giro.
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-700">
            Total de Etiquetas: <strong className="text-brand-primary text-sm">{totalLabels} etiquetas</strong>
            <span className="text-slate-400 font-normal ml-2">({Math.ceil(totalLabels / 3)} carreiras de 3 colunas)</span>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Fechar
            </Button>

            {/* Test 1 Row (3 labels) Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleTestPrint3Labels}
              className="border-slate-300 text-slate-800 hover:bg-slate-100 text-xs font-bold"
              title="Imprimir 1 carreira com 3 etiquetas lado a lado"
            >
              🧪 Testar 1 Linha (3 Etiquetas Lado a Lado)
            </Button>

            {/* Full Batch Print Button */}
            <Button
              type="button"
              variant="gold"
              onClick={() => executePrint(labelsToPrint)}
              disabled={totalLabels === 0}
              icon={<Printer className="w-4 h-4 text-slate-950" />}
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
