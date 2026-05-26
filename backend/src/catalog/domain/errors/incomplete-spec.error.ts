import { DomainRuleError } from '../../../shared/errors';

export class IncompletePanelSpecError extends DomainRuleError {
  constructor(missingFields: string[]) {
    super(`Panel spec is missing required fields: ${missingFields.join(', ')}`);
  }
}

export class IncompleteInverterSpecError extends DomainRuleError {
  constructor(missingFields: string[]) {
    super(`Inverter spec is missing required fields: ${missingFields.join(', ')}`);
  }
}
