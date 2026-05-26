export class CurrencyMismatchError extends Error {
  constructor(catalogCurrency: string, tariffCurrency: string) {
    super(
      `Currency mismatch: catalog uses "${catalogCurrency}" but tariff uses "${tariffCurrency}". ` +
        'FX conversion is not supported in v1.',
    );
    this.name = 'CurrencyMismatchError';
  }
}
