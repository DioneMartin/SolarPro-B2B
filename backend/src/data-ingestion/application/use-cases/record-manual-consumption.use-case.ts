import { Injectable, Inject } from '@nestjs/common';
import { ConsumptionRecord } from '../../domain/entities/consumption-record.entity';
import { CONSUMPTION_RECORD_REPOSITORY } from '../../domain/repositories/consumption-record.repository';
import type { ConsumptionRecordRepository } from '../../domain/repositories/consumption-record.repository';
import { MonthlyKwh } from '../../domain/value-objects/monthly-kwh.vo';
import { ConsumptionSource } from '../../domain/value-objects/consumption-source.enum';
import { ConsumptionStatus } from '../../domain/value-objects/consumption-status.enum';
import { v4 as uuidv4 } from 'uuid';
import { EVENT_BUS } from '../../../shared/event-bus/event-bus.port';
import type { EventBus } from '../../../shared/event-bus/event-bus.port';

interface Input {
  tenantId: string;
  projectId: string;
  months: { year: number; month: number; kwh: number }[];
}

@Injectable()
export class RecordManualConsumptionUseCase {
  constructor(
    @Inject(CONSUMPTION_RECORD_REPOSITORY)
    private readonly repo: ConsumptionRecordRepository,
    @Inject(EVENT_BUS)
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: Input): Promise<ConsumptionRecord> {
    const months = input.months.map((m) => MonthlyKwh.create(m.year, m.month, m.kwh));
    
    const record = ConsumptionRecord.create({
      id: uuidv4(),
      tenantId: input.tenantId,
      projectId: input.projectId,
      source: ConsumptionSource.MANUAL,
      status: ConsumptionStatus.READY,
      months,
    });

    if (!record.isValidForCalculation()) {
      throw new Error('Consumption record requires at least 3 months of data.');
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
