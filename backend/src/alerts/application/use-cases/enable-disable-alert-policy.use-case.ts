import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ALERT_POLICY_REPOSITORY } from '../../domain/repositories/alert-policy.repository';
import type { AlertPolicyRepository } from '../../domain/repositories/alert-policy.repository';
import type { AlertPolicy } from '../../domain/entities/alert-policy.entity';

@Injectable()
export class EnableDisableAlertPolicyUseCase {
  constructor(
    @Inject(ALERT_POLICY_REPOSITORY)
    private readonly repo: AlertPolicyRepository,
  ) {}

  async execute(id: string, tenantId: string, enable: boolean): Promise<AlertPolicy> {
    const policy = await this.repo.findById(id, tenantId);
    if (!policy) throw new NotFoundException(`Alert policy ${id} not found.`);
    enable ? policy.enable() : policy.disable();
    await this.repo.save(policy);
    return policy;
  }
}
