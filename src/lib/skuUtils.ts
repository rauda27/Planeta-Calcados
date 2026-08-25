import { Product } from '../types';

/**
 * Calculates the next sequential SKU for Planeta Calçados.
 * Base sequence starts from 26001, 26002, 26003...
 */
export function getNextSequentialSku(products: Product[] = []): string {
  const BASE_START_SKU = 26000;
  let maxSkuNum = BASE_START_SKU;

  if (products && products.length > 0) {
    for (const p of products) {
      if (!p.sku) continue;
      // Extract only digits from SKU
      const cleanNum = p.sku.replace(/\D/g, '');
      if (cleanNum) {
        const num = parseInt(cleanNum, 10);
        if (!isNaN(num) && num >= 26000 && num > maxSkuNum) {
          maxSkuNum = num;
        }
      }
    }
  }

  return String(maxSkuNum + 1);
}
