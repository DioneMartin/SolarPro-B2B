export class Tariff {
  private constructor(
    readonly currency: string,
    readonly pricePerKwh: number,
    readonly fixedFee?: number,
  ) {}

  static create(currency: string, pricePerKwh: number, fixedFee?: number): Tariff {
    if (pricePerKwh < 0) {
      throw new Error('pricePerKwh cannot be negative');
    }
    if (fixedFee !== undefined && fixedFee < 0) {
      throw new Error('fixedFee cannot be negative');
    }
    return new Tariff(currency, pricePerKwh, fixedFee);
  }

  static rehydrate(currency: string, pricePerKwh: number, fixedFee?: number): Tariff {
    return new Tariff(currency, pricePerKwh, fixedFee);
  }
}
