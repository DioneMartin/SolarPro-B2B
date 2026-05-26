import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertPolicyOrmEntity } from './alert-policy.orm-entity';
import { AlertPolicy } from '../../domain/entities/alert-policy.entity';
import type { AlertPolicyRepository } from '../../domain/repositories/alert-policy.repository';
import type { PolicyConfig, StrategyKind } from '../../domain/entities/alert-policy.entity';

@Injectable()
export class TypeOrmAlertPolicyRepository implements AlertPolicyRepository {
  constructor(
    @InjectRepository(AlertPolicyOrmEntity)
    private readonly ormRepo: Repository<AlertPolicyOrmEntity>,
  ) {}

  private toDomain(orm: AlertPolicyOrmEntity): AlertPolicy {
    return AlertPolicy.rehydrate({
      id: orm.id,
      tenantId: orm.tenantId,
      projectId: orm.projectId,
      strategyKind: orm.strategyKind as StrategyKind,
      config: orm.config as PolicyConfig,
      enabled: orm.enabled,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  private toOrm(domain: AlertPolicy): AlertPolicyOrmEntity {
    const orm = new AlertPolicyOrmEntity();
    orm.id = domain.id;
    orm.tenantId = domain.tenantId;
    orm.projectId = domain.projectId;
    orm.strategyKind = domain.strategyKind;
    orm.config = domain.config as object;
    orm.enabled = domain.enabled;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }

  async save(policy: AlertPolicy): Promise<void> {
    await this.ormRepo.save(this.toOrm(policy));
  }

  async findById(id: string, tenantId: string): Promise<AlertPolicy | null> {
    const orm = await this.ormRepo.findOne({ where: { id, tenantId } });
    return orm ? this.toDomain(orm) : null;
  }

  async findByProjectId(projectId: string, tenantId: string): Promise<AlertPolicy[]> {
    const orms = await this.ormRepo.find({ where: { projectId, tenantId } });
    return orms.map(o => this.toDomain(o));
  }

  async listEnabled(): Promise<AlertPolicy[]> {
    const orms = await this.ormRepo.find({ where: { enabled: true } });
    return orms.map(o => this.toDomain(o));
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.ormRepo.delete({ id, tenantId });
  }
}
