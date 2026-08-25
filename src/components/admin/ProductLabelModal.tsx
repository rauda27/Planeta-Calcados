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
} from 'lucide-react';

interface ProductLabelModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export type LabelFormat = 'thermal_3col_34x30' | 'thermal_50x30' | 'thermal_60x40' | 'a4_pimaco_30' | 'thermal_elgin_80';

export const ProductLabelModal: React.FC<ProductLabelModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { products } = useStore();

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [labelFormat, setLabelFormat] = useState<LabelFormat>('thermal_3col_34x30');
  
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
      // Initialize with 1 label for each variant in stock (or at least 1)
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

  // Compile list of all labels to print
  const labelsToPrint: {
    product: Product;
    variant: ProductVariant;
    barcodeValue: string;
  }[] = [];

  activeProduct.variants.forEach(variant => {
    const count = variantPrintCounts[variant.id] || 0;
    const barcodeVal = variant.ean || `${activeProduct.sku}-${variant.size}`;
    for (let i = 0; i < count; i++) {
      labelsToPrint.push({
        product: activeProduct,
        variant,
        barcodeValue: barcodeVal,
      });
    }
  });

  // Total count of labels
  const totalLabels = labelsToPrint.length;

  // Direct High-Quality Print Function
  const handlePrint = () => {
    if (totalLabels === 0) {
      alert('Selecione pelo menos 1 etiqueta para imprimir.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=850,height=650');
    if (!printWindow) {
      window.print();
      return;
    }

    // Build items HTML with barcode SVGs
    let itemsHtml = '';

    labelsToPrint.forEach(item => {
      const is34x30 = labelFormat === 'thermal_3col_34x30';
      const barcodeSvg = generateBarcodeSVG(item.barcodeValue, {
        height: is34x30 ? 20 : labelFormat === 'thermal_50x30' ? 28 : 34,
        moduleWidth: is34x30 ? 1.05 : 1.25,
        showText: true,
        fontSize: is34x30 ? 8 : 9,
      });

      const locationText = item.variant.shelfLocation
        ? `LOC: ${item.variant.shelfLocation}`
        : '';

      const priceText = formatBRL(item.product.salePrice);

      if (labelFormat === 'thermal_3col_34x30') {
        // 34mm x 30mm (3 Colunas / Carreira Tripla)
        itemsHtml += `
          <div class="label-box label-34x30">
            ${showStoreName ? '<div class="store-name">PLANETA CALÇADOS</div>' : ''}
            <div class="prod-title">${item.product.name}</div>
            <div class="meta-row">
              <span class="tam-badge">TAM: <strong>${item.variant.size}</strong></span>
              <span class="color-text">${item.variant.color}</span>
            </div>
            <div class="barcode-wrapper">${barcodeSvg}</div>
            <div class="bottom-row">
              ${showLocation && locationText ? `<span class="loc-tag">${locationText}</span>` : '<span></span>'}
              ${showPrice ? `<span class="price-tag">${priceText}</span>` : ''}
            </div>
          </div>
        `;
      } else if (labelFormat === 'thermal_50x30') {
        // 50mm x 30mm standard adhesive label (1 Coluna)
        itemsHtml += `
          <div class="label-box label-50x30">
            ${showStoreName ? '<div class="store-name">PLANETA CALÇADOS</div>' : ''}
            <div class="prod-title">${item.product.name}</div>
            <div class="meta-row">
              <span class="tam-badge">TAM: <strong>${item.variant.size}</strong></span>
              <span class="color-text">COR: ${item.variant.color}</span>
            </div>
            <div class="barcode-wrapper">${barcodeSvg}</div>
            <div class="bottom-row">
              ${showLocation && locationText ? `<span class="loc-tag">${locationText}</span>` : '<span></span>'}
              ${showPrice ? `<span class="price-tag">${priceText}</span>` : ''}
            </div>
          </div>
        `;
      } else if (labelFormat === 'thermal_60x40') {
        // 60mm x 40mm larger adhesive label
        itemsHtml += `
          <div class="label-box label-60x40">
            ${showStoreName ? '<div class="store-name font-bold">PLANETA CALÇADOS QB</div>' : ''}
            <div class="prod-title-lg">${item.product.name}</div>
            <div class="meta-row-lg">
              <span class="tam-badge-lg">TAM: <strong>${item.variant.size}</strong></span>
              <span class="color-text">COR: ${item.variant.color}</span>
              ${item.product.brand ? `<span>MARCA: ${item.product.brand}</span>` : ''}
            </div>
            <div class="barcode-wrapper">${barcodeSvg}</div>
            <div class="bottom-row-lg">
              ${showLocation && locationText ? `<span class="loc-tag">${locationText}</span>` : '<span></span>'}
              ${showPrice ? `<span class="price-tag-lg">${priceText}</span>` : ''}
            </div>
          </div>
        `;
      } else if (labelFormat === 'a4_pimaco_30') {
        // A4 sheet Pimaco 30 labels (3 cols x 10 rows)
        itemsHtml += `
          <div class="label-box label-a4-pimaco">
            ${showStoreName ? '<div class="store-name">PLANETA CALÇADOS</div>' : ''}
            <div class="prod-title">${item.product.name}</div>
            <div class="meta-row">
              <span>TAM: <strong>${item.variant.size}</strong></span>
              <span>COR: ${item.variant.color}</span>
            </div>
            <div class="barcode-wrapper">${barcodeSvg}</div>
            <div class="bottom-row">
              ${showLocation && locationText ? `<span class="loc-tag">${locationText}</span>` : '<span></span>'}
              ${showPrice ? `<span class="price-tag">${priceText}</span>` : ''}
            </div>
          </div>
        `;
      } else {
        // Elgin i9 80mm continuous thermal strip
        itemsHtml += `
          <div class="label-box label-elgin-80">
            ${showStoreName ? '<div class="store-name font-bold">PLANETA CALÇADOS</div>' : ''}
            <div class="prod-title-lg">${item.product.name}</div>
            <div class="meta-row">
              <span>TAM: <strong>${item.variant.size}</strong></span>
              <span>COR: ${item.variant.color}</span>
              ${item.product.brand ? `<span>MARCA: ${item.product.brand}</span>` : ''}
            </div>
            <div class="barcode-wrapper">${barcodeSvg}</div>
            <div class="bottom-row-lg">
              ${showLocation && locationText ? `<span class="loc-tag">${locationText}</span>` : '<span></span>'}
              ${showPrice ? `<span class="price-tag-lg">${priceText}</span>` : ''}
            </div>
          </div>
        `;
      }
    });

    const printCss = `
      @charset "UTF-8";
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: Arial, Helvetica, sans-serif;
        color: #000000;
        background: #ffffff;
      }
      .store-name { font-size: 7.5px; font-weight: 800; text-transform: uppercase; text-align: center; letter-spacing: 0.3px; border-bottom: 0.5px solid #000; padding-bottom: 1px; margin-bottom: 1.5px; }
      .prod-title { font-size: 8px; font-weight: 700; text-transform: uppercase; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .prod-title-lg { font-size: 10px; font-weight: 700; text-transform: uppercase; line-height: 1.1; margin-bottom: 2px; }
      .meta-row { display: flex; justify-content: space-between; font-size: 7.5px; font-weight: 600; margin-top: 1px; }
      .meta-row-lg { display: flex; justify-content: space-between; font-size: 9px; font-weight: 600; margin-top: 2px; }
      .tam-badge { font-size: 8.5px; font-weight: 900; }
      .tam-badge-lg { font-size: 11px; font-weight: 900; }
      .barcode-wrapper { margin: 1.5px 0; display: flex; justify-content: center; overflow: hidden; }
      .barcode-wrapper svg { max-width: 100%; height: auto; }
      .bottom-row { display: flex; justify-content: space-between; align-items: flex-end; font-size: 7.5px; margin-top: 1px; }
      .bottom-row-lg { display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; margin-top: 2px; }
      .price-tag { font-size: 10px; font-weight: 900; }
      .price-tag-lg { font-size: 13px; font-weight: 900; }
      .loc-tag { font-size: 7px; font-weight: 700; background: #eee; padding: 0.5px 2px; border-radius: 2px; border: 0.5px solid #aaa; }

      /* 34x30 mm 3 COLUNAS (Rolo Triplo 106mm / Zebra / Elgin L42 / Argox) */
      ${
        labelFormat === 'thermal_3col_34x30'
          ? `
        @page { size: 106mm 30mm; margin: 0; }
        .label-container {
          display: grid;
          grid-template-columns: 34mm 34mm 34mm;
          grid-auto-rows: 30mm;
          column-gap: 2mm;
          row-gap: 0mm;
          width: 106mm;
          margin: 0 auto;
        }
        .label-box {
          width: 34mm;
          height: 30mm;
          max-width: 34mm;
          max-height: 30mm;
          padding: 1mm 1.2mm;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          box-sizing: border-box;
          page-break-inside: avoid;
        }
      `
          : ''
      }

      /* 50x30 mm Thermal Label */
      ${
        labelFormat === 'thermal_50x30'
          ? `
        @page { size: 50mm 30mm; margin: 0; }
        .label-container { display: flex; flex-direction: column; }
        .label-box {
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

      /* 60x40 mm Thermal Label */
      ${
        labelFormat === 'thermal_60x40'
          ? `
        @page { size: 60mm 40mm; margin: 0; }
        .label-container { display: flex; flex-direction: column; }
        .label-box {
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

      /* A4 Pimaco Sheet (3 cols x 10 rows = 30 labels) */
      ${
        labelFormat === 'a4_pimaco_30'
          ? `
        @page { size: A4 portrait; margin: 10mm 5mm; }
        .label-container {
          display: grid;
          grid-template-columns: repeat(3, 66.7mm);
          grid-auto-rows: 25.4mm;
          gap: 2mm 3mm;
        }
        .label-box {
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

      /* Elgin i9 80mm continuous thermal strip */
      ${
        labelFormat === 'thermal_elgin_80'
          ? `
        @page { size: 80mm auto; margin: 0; }
        .label-container { width: 76mm; margin: 0 auto; padding: 2mm 0; }
        .label-box {
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
          <title>Etiquetas 34x30 - Planeta Calçados</title>
          <style>${printCss}</style>
        </head>
        <body>
          <div class="label-container">
            ${itemsHtml}
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Impressão de Etiquetas com Código de Barras"
      subtitle={`Etiquetas 34x30mm em 3 Colunas — ${activeProduct.name}`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
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
                  {p.name} ({p.sku}) — {formatBRL(p.salePrice)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Formato da Etiqueta / Papel
            </label>
            <select
              value={labelFormat}
              onChange={e => setLabelFormat(e.target.value as LabelFormat)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold bg-white text-slate-900 focus:ring-2 focus:ring-brand-primary"
            >
              <option value="thermal_3col_34x30">
                ⭐ 3 Colunas 34x30mm (Rolo Triplo 106mm — Elgin L42 / Zebra / Argox)
              </option>
              <option value="thermal_50x30">
                🏷️ 1 Coluna 50x30mm (Rolo Individual)
              </option>
              <option value="thermal_60x40">
                🏷️ 1 Coluna 60x40mm (Gôndola / Cabide)
              </option>
              <option value="a4_pimaco_30">
                📄 Folha A4 Adesiva Pimaco (30 etiquetas por folha)
              </option>
              <option value="thermal_elgin_80">
                🧾 Bobina Térmica 80mm Contínua (Elgin i9 / Cupom)
              </option>
            </select>
          </div>
        </div>

        {/* Live Preview Box & Customization Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* 1. Live Visual Preview */}
          <div className="md:col-span-1 bg-slate-100 p-4 rounded-xl border border-slate-200 text-center">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
              <Grid3X3 className="w-3.5 h-3.5 text-brand-primary" />
              <span>Prévia (34x30mm)</span>
            </div>

            {/* Simulated Label Card (34x30 proportion) */}
            <div className="bg-white rounded-lg p-2.5 shadow-md border border-slate-300 text-left font-sans text-slate-900 mx-auto max-w-[210px] space-y-1">
              {showStoreName && (
                <div className="text-[9px] font-black text-center uppercase border-b border-slate-300 pb-0.5 tracking-tight text-slate-800">
                  PLANETA CALÇADOS
                </div>
              )}
              <div className="font-bold text-[11px] uppercase leading-tight text-slate-900 line-clamp-1">
                {activeProduct.name}
              </div>
              <div className="flex justify-between text-[10px] font-semibold text-slate-700">
                <span>
                  TAM: <strong className="text-slate-950">{activeProduct.variants[0]?.size || 38}</strong>
                </span>
                <span className="truncate max-w-[90px]">{activeProduct.variants[0]?.color || 'Padrão'}</span>
              </div>

              <div className="py-0.5 flex justify-center">
                <Barcode
                  value={activeProduct.variants[0]?.ean || `${activeProduct.sku}-${activeProduct.variants[0]?.size || 38}`}
                  height={22}
                  moduleWidth={1.05}
                  fontSize={8}
                />
              </div>

              <div className="flex justify-between items-end pt-1 border-t border-slate-100">
                {showLocation && (
                  <span className="text-[8px] font-bold bg-slate-100 px-1 py-0.5 rounded border border-slate-200 text-slate-700">
                    {activeProduct.variants[0]?.shelfLocation ? `LOC: ${activeProduct.variants[0].shelfLocation}` : 'LOC: ESTOQUE'}
                  </span>
                )}
                {showPrice && (
                  <span className="text-[11px] font-black text-slate-950 ml-auto">
                    {formatBRL(activeProduct.salePrice)}
                  </span>
                )}
              </div>
            </div>

            <p className="text-[10px] text-slate-500 mt-3 font-medium">
              Layout: <strong>3 Colunas 34x30mm</strong>
            </p>
          </div>

          {/* 2. Grid Quantities Selector */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-200">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-primary" />
                <span>Escolher Quantidades por Numeração / Variação</span>
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
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
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
                      <td className="py-2 px-3 text-slate-700">{v.color}</td>
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

            {/* Customization Options */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-700 font-medium">
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
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-700">
            Total de Etiquetas: <strong className="text-brand-primary text-sm">{totalLabels} etiquetas</strong>
            <span className="text-slate-400 font-normal ml-2">({Math.ceil(totalLabels / 3)} carreiras de 3 colunas)</span>
          </div>

          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>

            <Button
              type="button"
              variant="gold"
              onClick={handlePrint}
              disabled={totalLabels === 0}
              icon={<Printer className="w-4 h-4 text-slate-950" />}
              className="shadow-gold px-6 font-bold"
            >
              Imprimir {totalLabels} Etiqueta{totalLabels === 1 ? '' : 's'} (34x30)
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
