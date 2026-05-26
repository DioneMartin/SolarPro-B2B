export class MonthlyKwh {
  private constructor(
    readonly year: number,
    readonly month: number,
    readonly kwh: number,
  ) {}

  static create(year: number, month: number, kwh: number): MonthlyKwh {
    if (month < 1 || month > 12) {
      throw new Error('Month must be between 1 and 12');
    }
    if (kwh < 0) {
      throw new Error('kWh cannot be negative');
    }
    return new MonthlyKwh(year, month, kwh);
  }

  static rehydrate(year: number, month: number, kwh: number): MonthlyKwh {
    return new MonthlyKwh(year, month, kwh);
  }
}
