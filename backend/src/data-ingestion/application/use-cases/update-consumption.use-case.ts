import { Injectable, Inject } from '@nestjs/common';
import { ConsumptionRecord } from '../../domain/entities/consumption-record.entity';
import { CONSUMPTION_RECORD_REPOSITORY } from '../../domain/repositories/consumption-record.repository';
import type { ConsumptionRecordRepository } from '../../domain/repositories/consumption-record.repository';
import { MonthlyKwh } from '../../domain/value-objects/monthly-kwh.vo';
import { EVENT_BUS } from '../../../shared/event-bus/event-bus.port';
import type { EventBus } from '../../../shared/event-bus/event-bus.port';

interface Input {
  id: string;
  tenantId: string;
  months: { year: number; month: number; kwh: number }[];
}

@Injectable()
export class UpdateConsumptionUseCase {
  constructor(
    @Inject(CONSUMPTION_RECORD_REPOSITORY)
    private readonly repo: ConsumptionRecordRepository,
    @Inject(EVENT_BUS)
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: Input): Promise<ConsumptionRecord> {
    const record = await this.repo.findById(input.id);
    if (!record || record.tenantId !== input.tenantId) {
      throw new Error('Consumption record not found');
    }

    const months = input.months.map((m) => MonthlyKwh.create(m.year, m.month, m.kwh));
    record.updateMonths(months);
    
    // Changing months could make it ready or invalid depending on counts, but for now we trust the input.
    if (record.isValidForCalculation()) {
      record.markAsReady();
    }

    await this.repo.save(record);

    await this.eventBus.publish('consumption.updated', {
      recordId: record.id,
      projectId: record.projectId,
      tenantId: record.tenantId,
      months: record.months,
    });

    return record;
  }
}
