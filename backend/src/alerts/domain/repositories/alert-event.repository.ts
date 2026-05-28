import type { AlertEvent } from '../entities/alert-event.entity';

export interface AlertEventFilter {
  tenantId: string;
  severity?: string;
  acknowledged?: boolean;
  since?: Date;
  projectId?: string;
  /** 'policy' = time/weather-based (policyId NOT NULL); 'activity' = domain-event-based (policyId IS NULL) */
  source?: 'policy' | 'activity';
}

export interface AlertEventRepository {
  save(event: AlertEvent): Promise<void>;
  findById(id: string, tenantId: string): Promise<AlertEvent | null>;
  findByFilter(filter: AlertEventFilter): Promise<AlertEvent[]>;
  /** Used for idempotency — check if an alert with this title was triggered for this policy after a given date. */
  existsSince(policyId: string, title: string, since: Date): Promise<boolean>;
}

export const ALERT_EVENT_REPOSITORY = 'ALERT_EVENT_REPOSITORY';
