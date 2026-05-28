import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AlertEvent } from '../../domain/entities/alert-event.entity';
import { ALERT_EVENT_REPOSITORY } from '../../domain/repositories/alert-event.repository';
import type { AlertEventRepository } from '../../domain/repositories/alert-event.repository';
import { EVENT_BUS } from '../../../shared/event-bus/event-bus.port';
import type { EventBus } from '../../../shared/event-bus/event-bus.port';

/**
 * Saves every significant domain event as an AlertEvent so it appears
 * in the "Alertas → Eventos" tab. These events have no policy (policyId = null).
 */
@Injectable()
export class OnActivityEventHandler implements OnModuleInit {
  private readonly logger = new Logger(OnActivityEventHandler.name);

  constructor(
    @Inject(ALERT_EVENT_REPOSITORY)
    private readonly eventRepo: AlertEventRepository,
    @Inject(EVENT_BUS)
    private readonly eventBus: EventBus,
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

    for (const eventName of events) {
      this.eventBus.subscribe(eventName, async (envelope) => {
        try {
          const payload = (envelope as any)?.payload ?? {};
          const tenantId = payload.tenantId as string | undefined;
          if (!tenantId) return;

          const { title, body, projectId } = this.format(eventName, payload);

          const alertEvent = AlertEvent.create({
            id: uuidv4(),
            tenantId,
            policyId: null,
            projectId: projectId ?? null,
            severity: 'INFO',
            title,
            body,
            payload,
            triggeredAt: new Date(),
          });

          await this.eventRepo.save(alertEvent);

          // Publish so connected clients invalidate their alerts query cache
          await this.eventBus.publish('alert.triggered', {
            eventId: alertEvent.id,
            tenantId,
            projectId: alertEvent.projectId,
            severity: 'INFO',
            title,
            body,
            triggeredAt: alertEvent.triggeredAt.toISOString(),
          });
        } catch (err: any) {
          this.logger.error(`Failed to record activity alert for ${eventName}: ${err.message}`);
        }
      });
    }

    this.logger.log('Activity event handler subscribed to domain events');
  }

  private format(
    type: string,
    payload: Record<string, unknown>,
  ): { title: string; body: string; projectId?: string } {
    switch (type) {
      case 'client.created':
        return {
          title: 'Nuevo cliente',
          body: `Se creó el cliente "${payload.displayName ?? ''}"`,
        };
      case 'project.created':
        return {
          title: 'Nuevo proyecto',
          body: 'Se creó un nuevo proyecto',
          projectId: payload.projectId as string,
        };
      case 'consumption.updated':
        return {
          title: 'Consumo actualizado',
          body: 'Se actualizaron los datos de consumo de un proyecto',
          projectId: payload.projectId as string,
        };
      case 'surface.updated':
        return {
          title: 'Superficie actualizada',
          body: 'Se actualizaron los datos de superficie de un proyecto',
          projectId: payload.projectId as string,
        };
      case 'proposal.generated':
        return {
          title: 'Nueva propuesta generada',
          body: 'Se generó una nueva propuesta solar',
          projectId: payload.projectId as string,
        };
      case 'proposal.rejected':
        return {
          title: 'Propuesta rechazada',
          body: 'Una propuesta fue rechazada',
          projectId: payload.projectId as string,
        };
      case 'project.rejected':
        return {
          title: 'Proyecto rechazado',
          body: 'Todas las propuestas fueron rechazadas — el proyecto fue movido a "Rechazado"',
          projectId: payload.projectId as string,
        };
      case 'project.approved':
        return {
          title: 'Proyecto aprobado',
          body: 'Un proyecto fue aprobado y está listo para instalación',
          projectId: payload.projectId as string,
        };
      default:
        return { title: 'Actividad', body: 'Se registró una nueva actividad' };
    }
  }
}
