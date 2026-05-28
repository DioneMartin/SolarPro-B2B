import { Injectable } from '@nestjs/common';
import { MonthlyKwh } from '../value-objects/monthly-kwh.vo';

/** Spanish 3-letter month abbreviations used on CFE bills → month number. */
const ES_MONTHS: Record<string, number> = {
  ENE: 1, FEB: 2, MAR: 3, ABR: 4, MAY: 5, JUN: 6,
  JUL: 7, AGO: 8, SEP: 9, OCT: 10, NOV: 11, DIC: 12,
};

interface BimonthlyPeriod {
  endYear: number;
  endMonth: number;
  kwh: number;
}

@Injectable()
export class UtilityBillParser {
  /**
   * Extracts monthly consumption from OCR/PDF text.
   * Tries the CFE "CONSUMO HISTÓRICO" layout first, then falls back to a
   * naive "YYYY MM kWh" format (used by manual/dummy data).
   */
  parse(text: string, _tenantHints?: any): MonthlyKwh[] {
    const cfe = this.parseCfeHistorico(text);
    if (cfe.length >= 3) return cfe;

    return this.parseNaive(text);
  }

  /**
   * CFE bills list bimonthly billing periods, most-recent-first, e.g.:
   *   "del 26 DIC 25 al 24 FEB 26 408 $647.00 $647.00"
   * The first number after the end date is the period consumption in kWh.
   * Each ~2-month period is split into two monthly entries so the downstream
   * annualizer (which assumes one entry == one month) scales correctly.
   */
  private parseCfeHistorico(text: string): MonthlyKwh[] {
    const lineRe =
      /del\s+\d{1,2}\s+([A-Za-zÁÉÍÓÚáéíóú]{3})\s+(\d{2})\s+al\s+\d{1,2}\s+([A-Za-zÁÉÍÓÚáéíóú]{3})\s+(\d{2})\s+([\d.,]+)\s+\$/gi;

    const periods: BimonthlyPeriod[] = [];
    for (const m of text.matchAll(lineRe)) {
      const endMonth = ES_MONTHS[m[3].toUpperCase()];
      const endYear = 2000 + parseInt(m[4], 10);
      const kwh = parseInt(m[5].replace(/[.,]/g, ''), 10);
      if (!endMonth || !Number.isFinite(kwh) || kwh < 0) continue;
      periods.push({ endYear, endMonth, kwh });
    }

    if (periods.length === 0) return [];

    // Most recent first, then take ~12 months (6 bimonthly periods).
    periods.sort((a, b) => b.endYear - a.endYear || b.endMonth - a.endMonth);
    const recent = periods.slice(0, 6);

    const months: MonthlyKwh[] = [];
    for (const p of recent) {
      const half = Math.round(p.kwh / 2);
      // End month gets half; the preceding month gets the remainder.
      const prevMonth = p.endMonth === 1 ? 12 : p.endMonth - 1;
      const prevYear = p.endMonth === 1 ? p.endYear - 1 : p.endYear;
      months.push(MonthlyKwh.create(p.endYear, p.endMonth, half));
      months.push(MonthlyKwh.create(prevYear, prevMonth, p.kwh - half));
    }
    return months;
  }

  /** Fallback: lines shaped like "YYYY MM kWh". */
  private parseNaive(text: string): MonthlyKwh[] {
    const months: MonthlyKwh[] = [];
    const regex = /(\d{4})\s+(\d{1,2})\s+(\d+(\.\d+)?)/;

    for (const line of text.split('\n')) {
      const match = regex.exec(line);
      if (match) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const kwh = parseFloat(match[3]);
        if (month >= 1 && month <= 12 && kwh >= 0) {
          months.push(MonthlyKwh.create(year, month, kwh));
        }
      }
    }
    return months;
  }
}
