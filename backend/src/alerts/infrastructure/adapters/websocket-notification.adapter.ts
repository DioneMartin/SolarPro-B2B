import { Injectable } from '@nestjs/common';
import type { NotificationPort } from '../../application/ports/notification.port';
import type { AlertEvent } from '../../domain/entities/alert-event.entity';
import { AlertsGateway } from '../websocket/alerts.gateway';

@Injectable()
export class WebSocketNotificationAdapter implements NotificationPort {
  constructor(private readonly gateway: AlertsGateway) {}

  async push(tenantId: string, event: AlertEvent, excludeUserIds?: string[]): Promise<void> {
    const payload = {
      eventId: event.id,
      policyId: event.policyId,
      severity: event.severity,
      title: event.title,
      body: event.body,
      triggeredAt: event.triggeredAt.toISOString(),
      projectId: event.projectId,
    };

    if (excludeUserIds?.length) {
      this.gateway.pushToTenantExcept(tenantId, excludeUserIds, payload);
    } else {
      this.gateway.pushToTenant(tenantId, payload);
    }
  }
}
