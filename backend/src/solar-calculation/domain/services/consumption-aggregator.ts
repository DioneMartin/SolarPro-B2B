import { InsufficientConsumptionError } from '../errors/insufficient-consumption.error';

export interface MonthEntry {
  year: number;
  month: number;
  kwh: number;
}

/**
 * Annualises consumption from a partial month list.
 * Requires at least 3 months; scales up if fewer than 12 months are provided.
 */
export function annualizeConsumption(months: MonthEntry[]): number {
  if (months.length < 3) {
    throw new InsufficientConsumptionError(months.length);
  }
  const total = months.reduce((sum, m) => sum + m.kwh, 0);
  return total * (12 / months.length);
}
