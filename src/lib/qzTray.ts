/**
 * qzTray.ts — Integracao com QZ Tray para impressao direta via PPLB
 * Download gratuito: https://qz.io/download/
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  interface Window { qz: any; }
}

const QZ_CDN = 'https://cdn.jsdelivr.net/npm/qz-tray@2.2.4/qz-tray.js';

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Not in browser'));
    if (window.qz) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${QZ_CDN}"]`);
    if (existing) { existing.addEventListener('load', () => resolve()); return; }
    const script = document.createElement('script');
    script.src = QZ_CDN;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Falha ao carregar QZ Tray JS. Verifique conexao com internet.'));
    document.head.appendChild(script);
  });
}

/**
 * Conecta ao QZ Tray local (WebSocket localhost:8181).
 * Na primeira vez, QZ Tray abrira uma janela pedindo confirmacao — clique em Allow.
 */
export async function connectQZ(): Promise<void> {
  await loadScript();
  const qz = window.qz;
  // Modo sem certificado (local/dev) — QZ Tray pedira confirmacao manual 1x
  qz.security.setCertificatePromise((r: any) => r(''));
  qz.security.setSignatureAlgorithm('SHA512');
  qz.security.setSignaturePromise((_t: string) => (r: any) => r(''));
  if (!qz.websocket.isActive()) {
    await qz.websocket.connect({ retries: 2, delay: 1 });
  }
}

/** Retorna true se QZ Tray esta conectado */
export function isQZConnected(): boolean {
  return typeof window !== 'undefined' && window.qz?.websocket?.isActive?.() === true;
}

/** Desconecta do QZ Tray */
export async function disconnectQZ(): Promise<void> {
  if (isQZConnected()) await window.qz.websocket.disconnect();
}

/**
 * Lista impressoras disponiveis que contenham o termo de busca.
 * @param query Parte do nome da impressora (ex: 'Argox')
 */
export async function findQZPrinters(query = 'Argox'): Promise<string[]> {
  const result = await window.qz.printers.find(query);
  return Array.isArray(result) ? result : result ? [result] : [];
}

/**
 * Envia dados RAW (PPLB/PPLA) diretamente para a impressora via QZ Tray.
 * @param printerName Nome exato da impressora no Windows
 * @param rawData     String com os comandos PPLB
 */
export async function printRawQZ(printerName: string, rawData: string): Promise<void> {
  const config = window.qz.configs.create(printerName);
  await window.qz.print(config, [{ type: 'raw', format: 'plain', data: rawData }]);
}

/**
 * Imprime imagens (Canvas 203 DPI) diretamente na impressora via QZ Tray Pixel Printing.
 * Funciona com 100% de precisão na Argox OS-214plus (3 Colunas 35x30mm).
 */
export async function printImagesQZ(
  printerName: string,
  imagesDataUrl: string[],
  options?: {
    widthMm?: number;
    heightMm?: number;
    rotation?: number;
  }
): Promise<void> {
  if (!imagesDataUrl.length) return;

  // rasterize: true converte o Canvas diretamente em bitmap térmico para o spooler do Windows
  const config = window.qz.configs.create(printerName, {
    rasterize: true,
    margins: 0,
    scaleContent: true,
  });

  const printData = imagesDataUrl
    .filter(url => Boolean(url && url.length > 20))
    .map(dataUrl => ({
      type: 'pixel',
      format: 'image',
      flavor: 'base64',
      data: dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl,
    }));

  if (!printData.length) {
    throw new Error('Nenhuma imagem válida para enviar à impressora.');
  }

  await window.qz.print(config, printData);
}

