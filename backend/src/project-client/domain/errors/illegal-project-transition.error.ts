import { DomainRuleError } from '../../../shared/errors';
import { ProjectStatus } from '../value-objects/project-status.enum';

export class IllegalProjectTransitionError extends DomainRuleError {
  constructor(from: ProjectStatus, to: ProjectStatus) {
    super(`Cannot transition project from ${from} to ${to}`);
  }
}
