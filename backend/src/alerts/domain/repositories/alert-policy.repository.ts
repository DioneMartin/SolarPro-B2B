import type { AlertPolicy } from '../entities/alert-policy.entity';

export interface AlertPolicyRepository {
  save(policy: AlertPolicy): Promise<void>;
  findById(id: string, tenantId: string): Promise<AlertPolicy | null>;
  findByProjectId(projectId: string, tenantId: string): Promise<AlertPolicy[]>;
  listEnabled(): Promise<AlertPolicy[]>;
  delete(id: string, tenantId: string): Promise<void>;
}

export const ALERT_POLICY_REPOSITORY = 'ALERT_POLICY_REPOSITORY';
