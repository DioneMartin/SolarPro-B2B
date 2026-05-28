import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { EVENT_BUS } from '../event-bus/event-bus.port';
import type { EventBus } from '../event-bus/event-bus.port';
import { NotificationGateway, type ActivityNotification } from './notification.gateway';

/**
 * Subscribes to domain events on the Redis event bus and pushes
 * real-time notifications to all WebSocket clients in the same tenant.
 */
@Injectable()
export class ActivityNotificationListener implements OnModuleInit {
  private readonly logger = new Logger(ActivityNotificationListener.name);

  constructor(
    @Inject(EVENT_BUS) private readonly eventBus: EventBus,
    private readonly gateway: NotificationGateway,
  ) {}

  onModuleInit(): void {
    const events = [
      'client.created',
      'project.created',
      'consumption.updated',
      'surface.updated',
      'proposal.generated',
      'proposal.rejected',
      'project.rejected',
      'project.approved',
    ];

    for (const event of events) {
      this.eventBus.subscribe(event, (envelope) => {
        try {
          const payload = (envelope as any)?.payload ?? {};
          const tenantId = payload.tenantId as string | undefined;
          if (!tenantId) return;

          const notification = this.format(event, payload);
          this.gateway.pushToTenant(tenantId, notification);
        } catch (err: any) {
          this.logger.error(`Failed to push notification for ${event}: ${err.message}`);
        }
      });
    }

    this.logger.log('Activity notification listener subscribed to domain events');
  }

  private format(type: string, payload: Record<string, unknown>): ActivityNotification {
    switch (type) {
      case 'client.created':
        return {
          type,
          title: 'Nuevo cliente',
          body: `Se creó el cliente "${payload.displayName ?? ''}"`,
          meta: { clientId: payload.clientId },
        };
      case 'project.created':
        return {
          type,
          title: 'Nuevo proyecto',
          body: 'Se creó un nuevo proyecto',
          meta: { projectId: payload.projectId },
        };
      case 'consumption.updated':
        return {
          type,
          title: 'Consumo actualizado',
          body: 'Se actualizaron los datos de consumo de un proyecto',
          meta: { projectId: payload.projectId },
        };
      case 'surface.updated':
        return {
          type,
          title: 'Superficie actualizada',
          body: 'Se actualizaron los datos de superficie de un proyecto',
          meta: { projectId: payload.projectId },
        };
      case 'proposal.generated':
        return {
          type,
          title: 'Nueva propuesta generada',
          body: 'Se generó una nueva propuesta solar',
          meta: { proposalId: payload.proposalId, projectId: payload.projectId },
        };
      case 'proposal.rejected':
        return {
          type,
          title: 'Propuesta rechazada',
          body: 'Una propuesta fue rechazada',
          meta: { proposalId: payload.proposalId, projectId: payload.projectId },
        };
      case 'project.rejected':
        return {
          type,
          title: 'Proyecto rechazado',
          body: 'Todas las propuestas fueron rechazadas — el proyecto fue movido a "Rechazado"',
          meta: { projectId: payload.projectId },
        };
      case 'project.approved':
        return {
          type,
          title: 'Proyecto aprobado',
          body: 'Un proyecto fue aprobado y está listo para instalación',
          meta: { projectId: payload.projectId },
        };
      default:
        return { type, title: 'Actividad', body: 'Se registró una nueva actividad' };
    }
  }
}
