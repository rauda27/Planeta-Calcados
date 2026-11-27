/**
 * Utilitarios de data no fuso LOCAL da loja.
 *
 * `new Date().toISOString().split('T')[0]` devolve a data em UTC: em Brasilia (UTC-3), depois
 * das 21h isso ja e o dia seguinte, o que fazia parcelas "vencerem" um dia antes, vendas da
 * noite caírem no dia errado do caixa, etc. Use sempre estas funcoes.
 */

const pad = (n: number) => String(n).padStart(2, '0');

/** Data local no formato YYYY-MM-DD (hoje, se nada for passado). */
export const toLocalDateStr = (input: Date | string | number = new Date()): string => {
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Mes local no formato YYYY-MM. */
export const toLocalMonthStr = (input: Date | string | number = new Date()): string =>
  toLocalDateStr(input).slice(0, 7);

/** Diferenca em dias corridos entre duas datas YYYY-MM-DD (b - a). */
export const diffInDays = (a: string, b: string): number => {
  const da = new Date(`${a.slice(0, 10)}T12:00:00`);
  const db = new Date(`${b.slice(0, 10)}T12:00:00`);
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
};
