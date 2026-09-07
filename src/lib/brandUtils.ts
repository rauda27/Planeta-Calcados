/**
 * Utilitário de Normalização e Detecção Inteligente de Marcas
 * Separa marcas agrupadas incorretamente (ex: "BEIRA RIO / MOLECA / VIZZANO")
 * para os seus setores e marcas individuais corretos (ex: "Moleca", "Vizzano", "Modare", "Beira Rio").
 */

export function normalizeBrand(product: { name?: string; brand?: string; model?: string }): string {
  const currentBrand = (product.brand || '').trim();
  const name = (product.name || '').toUpperCase();
  const model = (product.model || '').toUpperCase();
  const brandUpper = currentBrand.toUpperCase();

  const fullText = `${brandUpper} ${name} ${model}`;

  // 1. Detecções específicas por ordem de prioridade
  if (fullText.includes('MOLEKINHA') || fullText.includes('MOLEK.')) return 'Molekinha';
  if (fullText.includes('MOLEKINHO')) return 'Molekinho';
  if (fullText.includes('MOLECA') || fullText.includes('5287265') || fullText.includes('5666106')) return 'Moleca';
  if (fullText.includes('VIZZANO') || fullText.includes('VIZANO') || fullText.includes('VEZANO')) return 'Vizzano';
  if (fullText.includes('MODARE') || fullText.includes('MODARI')) return 'Modare';
  if (fullText.includes('ACTVITTA') || fullText.includes('ACTEVITA') || fullText.includes('ATVTA')) return 'Actvitta';
  if (fullText.includes('BR SPORT') || fullText.includes('BRESPORTE')) return 'BR Sport';
  if (fullText.includes('BEIRA RIO') || fullText.includes('BEIRO RIO') || fullText.includes('B. RIO') || fullText.includes('B RIO')) return 'Beira Rio';
  
  if (fullText.includes('COMFORTFLEX')) return 'Comfortflex';
  if (fullText.includes('RAMARIM')) return 'Ramarim';
  
  if (fullText.includes('MISSISSIPI') || fullText.includes('MISSISIP')) return 'Mississipi';
  if (fullText.includes('PINK CATS')) return 'Pink Cats';
  if (fullText.includes('KOLOSH')) return 'Kolosh';
  if (fullText.includes('DAKOTA')) return 'Dakota';

  if (fullText.includes('PICCADILLY') || fullText.includes('PICADILLY') || fullText.includes('PICAD') || fullText.includes('PCDLI')) return 'Piccadilly';
  if (fullText.includes('BOAONDA') || fullText.includes('BOA ONDA') || fullText.includes('BO. ONDA')) return 'Boaonda';
  if (fullText.includes('HAVAIANAS') || fullText.includes('HAVAIANA') || fullText.includes('HAV')) return 'Havaianas';
  if (fullText.includes('IPANEMA')) return 'Ipanema';
  if (fullText.includes('RIDER')) return 'Rider';
  if (fullText.includes('CARTAGO') || fullText.includes('GARTAGO')) return 'Cartago';
  if (fullText.includes('GRENDHA')) return 'Grendha';
  if (fullText.includes('GRENDENE') || fullText.includes('GRANDENI')) return 'Grendene';
  if (fullText.includes('ROVITEX') || fullText.includes('ROVETEX') || fullText.includes('ROVTX') || fullText.includes('RVTX')) return 'Rovitex';
  if (fullText.includes('SELENE')) return 'Selene';
  if (fullText.includes('DRAY')) return 'Dray';
  if (fullText.includes('LYND')) return 'Lynd';
  if (fullText.includes('PEGADA')) return 'Pegada';
  if (fullText.includes('RAFARILLO') || fullText.includes('RAFAPILLO')) return 'Rafarillo';
  if (fullText.includes('SAFIRA')) return 'Safira';
  if (fullText.includes('RCN') || fullText.includes('RACANA')) return 'RCN';
  if (fullText.includes('NIZAR')) return 'Nizar';
  if (fullText.includes('BIBI') || fullText.includes('BEBI')) return 'Bibi';
  if (fullText.includes('PIMPOLHO')) return 'Pimpolho';
  if (fullText.includes('OXN') || fullText.includes('CHUTERA OXN')) return 'OXN';
  if (fullText.includes('BEBECE') || fullText.includes('BBCE')) return 'Bebecê';
  if (fullText.includes('TERRA AGUA') || fullText.includes('TERRA & AGUA')) return 'Terra & Água';

  // Se a marca for uma string composta com barra (ex: "BEIRA RIO / MOLECA / VIZZANO")
  if (currentBrand.includes('/')) {
    const firstPart = currentBrand.split('/')[0].trim();
    if (firstPart) {
      return firstPart.charAt(0).toUpperCase() + firstPart.slice(1).toLowerCase();
    }
  }

  return currentBrand || 'Outras Marcas';
}
