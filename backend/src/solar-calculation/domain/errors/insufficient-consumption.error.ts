import { DomainRuleError } from '../../../shared/errors';

export class InsufficientConsumptionError extends DomainRuleError {
  constructor(monthCount: number) {
    super(
      `Se requieren al menos 3 meses de datos de consumo para el cálculo; ` +
      `se encontraron ${monthCount}. Agrega más meses antes de generar la propuesta.`,
    );
  }
}
