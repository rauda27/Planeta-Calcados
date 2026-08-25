/**
 * Interest and Fine Calculator for Overdue Debt (Brazilian Legislation)
 * - Multa por Atraso: Máximo de 2% (Art. 52, § 1º do CDC)
 * - Juros Moratórios: 1% ao mês pro rata die (Art. 406 do Código Civil c/c Art. 161, § 1º do CTN) = (0.01 / 30) ao dia
 */

export interface OverdueCalculation {
  daysOverdue: number;
  originalAmount: number;
  fineAmount: number;        // 2% fixo pelo CDC
  interestAmount: number;    // 1% ao mês pro rata die
  totalCorrectedAmount: number;
  isOverdue: boolean;
}

export function calculateOverdueDebt(
  originalAmount: number,
  dueDateStr: string,
  targetDateStr?: string
): OverdueCalculation {
  if (!originalAmount || originalAmount <= 0) {
    return {
      daysOverdue: 0,
      originalAmount: 0,
      fineAmount: 0,
      interestAmount: 0,
      totalCorrectedAmount: 0,
      isOverdue: false,
    };
  }

  try {
    const targetDate = targetDateStr ? new Date(targetDateStr + 'T23:59:59') : new Date();
    const dueDate = new Date(dueDateStr + 'T23:59:59');

    const diffMs = targetDate.getTime() - dueDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0 || isNaN(diffDays)) {
      return {
        daysOverdue: 0,
        originalAmount: Number(originalAmount.toFixed(2)),
        fineAmount: 0,
        interestAmount: 0,
        totalCorrectedAmount: Number(originalAmount.toFixed(2)),
        isOverdue: false,
      };
    }

    // 1. Multa moratória: 2,00% sobre o valor da parcela (CDC Art. 52)
    const fineAmount = Number((originalAmount * 0.02).toFixed(2));

    // 2. Juros de mora: 1,00% ao mês pro rata die (~0,0333% ao dia)
    const dailyInterestRate = 0.01 / 30;
    const interestAmount = Number((originalAmount * dailyInterestRate * diffDays).toFixed(2));

    // 3. Valor Total Corrigido
    const totalCorrectedAmount = Number((originalAmount + fineAmount + interestAmount).toFixed(2));

    return {
      daysOverdue: diffDays,
      originalAmount: Number(originalAmount.toFixed(2)),
      fineAmount,
      interestAmount,
      totalCorrectedAmount,
      isOverdue: true,
    };
  } catch {
    return {
      daysOverdue: 0,
      originalAmount: Number(originalAmount.toFixed(2)),
      fineAmount: 0,
      interestAmount: 0,
      totalCorrectedAmount: Number(originalAmount.toFixed(2)),
      isOverdue: false,
    };
  }
}
