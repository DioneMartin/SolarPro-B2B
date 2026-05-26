import { Injectable, Inject } from '@nestjs/common';
import { ConsumptionRecord } from '../../domain/entities/consumption-record.entity';
import { CONSUMPTION_RECORD_REPOSITORY } from '../../domain/repositories/consumption-record.repository';
import type { ConsumptionRecordRepository } from '../../domain/repositories/consumption-record.repository';

@Injectable()
export class GetConsumptionUseCase {
  constructor(
    @Inject(CONSUMPTION_RECORD_REPOSITORY)
    private readonly repo: ConsumptionRecordRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<ConsumptionRecord> {
    const record = await this.repo.findById(id);
    if (!record || record.tenantId !== tenantId) {
      throw new Error('Consumption record not found');
    }
    return record;
  }
}
