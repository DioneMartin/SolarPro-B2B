import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { InverterModel } from '../../domain/entities/inverter-model.entity';
import type { InverterModelRepository } from '../../domain/repositories/inverter-model.repository';
import type { CatalogStatus } from '../../domain/value-objects/catalog-status.enum';
import { InverterModelMapper } from './inverter-model.mapper';
import { InverterModelOrmEntity } from './inverter-model.orm-entity';

@Injectable()
export class TypeOrmInverterModelRepository implements InverterModelRepository {
  constructor(
    @InjectRepository(InverterModelOrmEntity)
    private readonly repo: Repository<InverterModelOrmEntity>,
  ) {}

  async findById(id: string, tenantId: string): Promise<InverterModel | null> {
    const orm = await this.repo.findOne({ where: { id, tenantId } });
    return orm ? InverterModelMapper.toDomain(orm) : null;
  }

  async findAllByTenant(tenantId: string, status?: CatalogStatus): Promise<InverterModel[]> {
    const where: Record<string, unknown> = { tenantId };
    if (status) where['status'] = status;
    const orms = await this.repo.find({ where, order: { brand: 'ASC', modelName: 'ASC' } });
    return orms.map(InverterModelMapper.toDomain);
  }

  async save(inverter: InverterModel): Promise<void> {
    await this.repo.save(InverterModelMapper.toOrm(inverter));
  }
}
