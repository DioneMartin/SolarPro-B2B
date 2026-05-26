import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { AlertEventOrmEntity } from './alert-event.orm-entity';
import { AlertEvent } from '../../domain/entities/alert-event.entity';
import type { AlertEventRepository, AlertEventFilter } from '../../domain/repositories/alert-event.repository';
import type { AlertSeverity } from '../../domain/entities/alert-event.entity';

@Injectable()
export class TypeOrmAlertEventRepository implements AlertEventRepository {
  constructor(
    @InjectRepository(AlertEventOrmEntity)
    private readonly ormRepo: Repository<AlertEventOrmEntity>,
  ) {}

  private toDomain(orm: AlertEventOrmEntity): AlertEvent {
    return AlertEvent.rehydrate({
      id: orm.id,
      tenantId: orm.tenantId,
      policyId: orm.policyId,
      projectId: orm.projectId,
      severity: orm.severity as AlertSeverity,
      title: orm.title,
      body: orm.body,
      payload: orm.payload as Record<string, unknown>,
      triggeredAt: orm.triggeredAt,
      acknowledgedAt: orm.acknowledgedAt ?? undefined,
      acknowledgedBy: orm.acknowledgedBy ?? undefined,
    });
  }

  private toOrm(domain: AlertEvent): AlertEventOrmEntity {
    const orm = new AlertEventOrmEntity();
    orm.id = domain.id;
    orm.tenantId = domain.tenantId;
    orm.policyId = domain.policyId;
    orm.projectId = domain.projectId;
    orm.severity = domain.severity;
    orm.title = domain.title;
    orm.body = domain.body;
    orm.payload = domain.payload as object;
    orm.triggeredAt = domain.triggeredAt;
    orm.acknowledgedAt = domain.acknowledgedAt ?? null;
    orm.acknowledgedBy = domain.acknowledgedBy ?? null;
    return orm;
  }

  async save(event: AlertEvent): Promise<void> {
    await this.ormRepo.save(this.toOrm(event));
  }

  async findById(id: string, tenantId: string): Promise<AlertEvent | null> {
    const orm = await this.ormRepo.findOne({ where: { id, tenantId } });
    return orm ? this.toDomain(orm) : null;
  }

  async findByFilter(filter: AlertEventFilter): Promise<AlertEvent[]> {
    const where: any = { tenantId: filter.tenantId };
    if (filter.severity) where.severity = filter.severity;
    if (filter.projectId) where.projectId = filter.projectId;
    if (filter.since) where.triggeredAt = MoreThanOrEqual(filter.since);
    if (filter.acknowledged === false) where.acknowledgedAt = null;
    if (filter.acknowledged === true) where.acknowledgedAt = MoreThanOrEqual(new Date(0));

    const orms = await this.ormRepo.find({ where, order: { triggeredAt: 'DESC' } });
    return orms.map(o => this.toDomain(o));
  }

  async existsSince(policyId: string, title: string, since: Date): Promise<boolean> {
    const count = await this.ormRepo.count({
      where: {
        policyId,
        title,
        triggeredAt: MoreThanOrEqual(since),
      },
    });
    return count > 0;
  }
}
