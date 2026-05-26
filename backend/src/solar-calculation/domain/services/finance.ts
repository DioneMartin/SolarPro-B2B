import type { Money } from '../../../shared/types/catalog-query.port';
import { CurrencyMismatchError } from '../errors/currency-mismatch.error';

export interface FinanceInput {
  capexTotal: Money;
  annualProductionKwh: number;
  tariff: { currency: string; pricePerKwh: number; fixedFee?: number };
  horizonYears: number;
  energyInflationPctPerYear: number;
  discountRatePct?: number;
}

export interface FinanceResult {
  annualSavings: Money[];
  cumulativeSavings: Money[];
  paybackYear?: number;
  roi20YearPct: number;
  npv?: Money;
}

export function computeFinance(input: FinanceInput): FinanceResult {
  const { capexTotal, annualProductionKwh, tariff, horizonYears, energyInflationPctPerYear, discountRatePct } = input;
  const currency = capexTotal.currency;

  if (tariff.currency !== currency) {
    throw new CurrencyMismatchError(currency, tariff.currency);
  }

  const inflation = energyInflationPctPerYear / 100;
  const discountRate = discountRatePct !== undefined ? discountRatePct / 100 : undefined;

  const annualSavings: Money[] = [];
  const cumulativeSavings: Money[] = [];
  let cumulative = 0;
  let paybackYear: number | undefined;
  let npvAmount = 0;

  for (let y = 0; y < horizonYears; y++) {
    const tariffYear = tariff.pricePerKwh * Math.pow(1 + inflation, y);
    const savingsAmount = annualProductionKwh * tariffYear;

    annualSavings.push({ amount: savingsAmount, currency });

    cumulative += savingsAmount;
    cumulativeSavings.push({ amount: cumulative, currency });

    if (paybackYear === undefined && cumulative >= capexTotal.amount) {
      paybackYear = y + 1; // 1-based year
    }

    if (discountRate !== undefined) {
      npvAmount += savingsAmount / Math.pow(1 + discountRate, y + 1);
    }
  }

  // ROI uses the 20-year horizon regardless of horizonYears (per spec)
  const cum20 = cumulativeSavings[Math.min(19, horizonYears - 1)]?.amount ?? 0;
  const roi20YearPct = capexTotal.amount > 0 ? ((cum20 - capexTotal.amount) / capexTotal.amount) * 100 : 0;

  const result: FinanceResult = {
    annualSavings,
    cumulativeSavings,
    paybackYear,
    roi20YearPct,
  };

  if (discountRate !== undefined) {
    result.npv = { amount: npvAmount - capexTotal.amount, currency };
  }

  return result;
}
