import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ALERT_EVENT_REPOSITORY } from '../../domain/repositories/alert-event.repository';
import type { AlertEventRepository } from '../../domain/repositories/alert-event.repository';
import type { AlertEvent } from '../../domain/entities/alert-event.entity';
import { EVENT_BUS } from '../../../shared/event-bus/event-bus.port';
import type { EventBus } from '../../../shared/event-bus/event-bus.port';

@Injectable()
export class AcknowledgeAlertEventUseCase {
  constructor(
    @Inject(ALERT_EVENT_REPOSITORY)
    private readonly repo: AlertEventRepository,
    @Inject(EVENT_BUS)
    private readonly eventBus: EventBus,
  ) {}

  async execute(id: string, tenantId: string, userId: string): Promise<AlertEvent> {
    const event = await this.repo.findById(id, tenantId);
    if (!event) throw new NotFoundException(`Alert event ${id} not found.`);
    event.acknowledge(userId);
    await this.repo.save(event);
    await this.eventBus.publish('alert.acknowledged', {
      eventId: event.id,
      userId,
      acknowledgedAt: event.acknowledgedAt!.toISOString(),
    });
    return event;
  }
}
