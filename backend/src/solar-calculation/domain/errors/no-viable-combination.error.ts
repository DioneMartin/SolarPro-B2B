import { DomainRuleError } from '../../../shared/errors';

export class NoViableCombinationError extends DomainRuleError {
  constructor(reason: string) {
    super(`No se encontró ninguna combinación viable de panel+inversor: ${reason}`);
  }
}
