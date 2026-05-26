import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsumptionRecordOrmEntity } from '../persistence/consumption-record.orm-entity';
import type { ConsumptionReaderPort, ConsumptionSnapshot } from '../../../shared/types/data-reader.ports';

@Injectable()
export class ConsumptionReaderAdapter implements ConsumptionReaderPort {
  constructor(
    @InjectRepository(ConsumptionRecordOrmEntity)
    private readonly ormRepo: Repository<ConsumptionRecordOrmEntity>,
  ) {}

  async findReadyByProjectId(projectId: string, tenantId: string): Promise<ConsumptionSnapshot | null> {
    const orm = await this.ormRepo.findOne({
      where: { projectId, tenantId, status: 'READY' },
      order: { createdAt: 'DESC' },
    });
    if (!orm) return null;

    return {
      months: (orm.months ?? []).map((m: any) => ({ year: m.year, month: m.month, kwh: m.kwh })),
      source: orm.source as 'MANUAL' | 'OCR_PDF' | 'OCR_IMAGE',
      tariff: orm.tariff
        ? { currency: orm.tariff.currency, pricePerKwh: orm.tariff.pricePerKwh, fixedFee: orm.tariff.fixedFee }
        : undefined,
    };
  }
}
