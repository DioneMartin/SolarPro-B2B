import { DomainRuleError } from '../../../shared/errors';

export class LastAdminError extends DomainRuleError {
  constructor() {
    super('Cannot remove or disable the last active TenantAdmin in this tenant');
  }
}
