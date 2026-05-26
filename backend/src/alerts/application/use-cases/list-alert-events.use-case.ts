import { Injectable, Inject } from '@nestjs/common';
import { ALERT_EVENT_REPOSITORY } from '../../domain/repositories/alert-event.repository';
import type { AlertEventRepository, AlertEventFilter } from '../../domain/repositories/alert-event.repository';
import type { AlertEvent } from '../../domain/entities/alert-event.entity';

@Injectable()
export class ListAlertEventsUseCase {
  constructor(
    @Inject(ALERT_EVENT_REPOSITORY)
    private readonly repo: AlertEventRepository,
  ) {}

  async execute(filter: AlertEventFilter): Promise<AlertEvent[]> {
    return this.repo.findByFilter(filter);
  }
}
