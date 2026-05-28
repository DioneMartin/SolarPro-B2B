import { DomainRuleError } from '../../../shared/errors';

export class NoCandidatesError extends DomainRuleError {
  constructor() {
    super(
      'Ningún candidato de propuesta sobrevivió los filtros aplicados. ' +
      'Prueba relajando los filtros: desactiva "debe caber en la superficie" o ' +
      '"debe cumplir el objetivo de cobertura", amplía el rango de precios, o ' +
      'reduce el porcentaje de cobertura objetivo.',
    );
  }
}
