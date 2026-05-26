import type { AlertEvent } from '../../domain/entities/alert-event.entity';

export interface NotificationPort {
  push(tenantId: string, event: AlertEvent): Promise<void>;
}

export const NOTIFICATION_PORT = 'NOTIFICATION_PORT';
