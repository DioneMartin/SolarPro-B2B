import { DomainRuleError } from '../../../shared/errors';

export class ProjectNotReadyError extends DomainRuleError {
  constructor(missing: string) {
    super(`Project cannot advance: missing ${missing}`);
  }
}
