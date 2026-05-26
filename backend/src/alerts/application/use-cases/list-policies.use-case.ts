import { Injectable, Inject } from '@nestjs/common';
import { ALERT_POLICY_REPOSITORY } from '../../domain/repositories/alert-policy.repository';
import type { AlertPolicyRepository } from '../../domain/repositories/alert-policy.repository';
import type { AlertPolicy } from '../../domain/entities/alert-policy.entity';

@Injectable()
export class ListPoliciesUseCase {
  constructor(
    @Inject(ALERT_POLICY_REPOSITORY)
    private readonly repo: AlertPolicyRepository,
  ) {}

  async execute(tenantId: string, projectId?: string): Promise<AlertPolicy[]> {
    if (projectId) return this.repo.findByProjectId(projectId, tenantId);
    return this.repo.listEnabled();
  }
}
