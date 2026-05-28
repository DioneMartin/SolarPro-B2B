import { DomainRuleError } from '../../../shared/errors';

export class CurrencyMismatchError extends DomainRuleError {
  constructor(catalogCurrency: string, tariffCurrency: string) {
    super(
      `Inconsistencia de moneda: el catálogo usa "${catalogCurrency}" pero la tarifa usa "${tariffCurrency}". ` +
      `La conversión de divisas no está soportada en esta versión. ` +
      `Asegúrate de que todos los productos del catálogo estén en la misma moneda que la tarifa eléctrica.`,
    );
  }
}
