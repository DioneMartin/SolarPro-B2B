import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsumptionRecordOrmEntity } from './consumption-record.orm-entity';
import { ConsumptionRecord } from '../../domain/entities/consumption-record.entity';
import { ConsumptionRecordRepository } from '../../domain/repositories/consumption-record.repository';
import { MonthlyKwh } from '../../domain/value-objects/monthly-kwh.vo';
import { Tariff } from '../../domain/value-objects/tariff.vo';
import { ConsumptionSource } from '../../domain/value-objects/consumption-source.enum';
import { ConsumptionStatus } from '../../domain/value-objects/consumption-status.enum';

@Injectable()
export class TypeOrmConsumptionRecordRepository implements ConsumptionRecordRepository {
  constructor(
    @InjectRepository(ConsumptionRecordOrmEntity)
    private readonly ormRepo: Repository<ConsumptionRecordOrmEntity>,
  ) {}

  private toDomain(orm: ConsumptionRecordOrmEntity): ConsumptionRecord {
    return ConsumptionRecord.rehydrate({
      id: orm.id,
      tenantId: orm.tenantId,
      projectId: orm.projectId,
      source: orm.source as ConsumptionSource,
      status: orm.status as ConsumptionStatus,
      rawFileRef: orm.rawFileRef ?? undefined,
      tariff: orm.tariff ? Tariff.rehydrate(orm.tariff.currency, orm.tariff.pricePerKwh, orm.tariff.fixedFee) : undefined,
      months: (orm.months || []).map((m: any) => MonthlyKwh.rehydrate(m.year, m.month, m.kwh)),
      notes: orm.notes ?? undefined,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  private toOrm(domain: ConsumptionRecord): ConsumptionRecordOrmEntity {
    const orm = new ConsumptionRecordOrmEntity();
    orm.id = domain.id;
    orm.tenantId = domain.tenantId;
    orm.projectId = domain.projectId;
    orm.source = domain.source;
    orm.status = domain.status;
    orm.rawFileRef = domain.rawFileRef ?? null;
    orm.tariff = domain.tariff ? { currency: domain.tariff.currency, pricePerKwh: domain.tariff.pricePerKwh, fixedFee: domain.tariff.fixedFee } : null;
    orm.months = domain.months.map(m => ({ year: m.year, month: m.month, kwh: m.kwh }));
    orm.notes = domain.notes ?? null;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }

  async save(record: ConsumptionRecord): Promise<void> {
    const orm = this.toOrm(record);
    await this.ormRepo.save(orm);
  }

  async findById(id: string): Promise<ConsumptionRecord | null> {
    const orm = await this.ormRepo.findOne({ where: { id } });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  async findByProjectId(projectId: string): Promise<ConsumptionRecord[]> {
    const orms = await this.ormRepo.find({ where: { projectId } });
    return orms.map(o => this.toDomain(o));
  }
}
