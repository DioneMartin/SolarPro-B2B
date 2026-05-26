import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PanelModel } from '../../domain/entities/panel-model.entity';
import type { PanelModelRepository } from '../../domain/repositories/panel-model.repository';
import type { CatalogStatus } from '../../domain/value-objects/catalog-status.enum';
import { PanelModelMapper } from './panel-model.mapper';
import { PanelModelOrmEntity } from './panel-model.orm-entity';

@Injectable()
export class TypeOrmPanelModelRepository implements PanelModelRepository {
  constructor(
    @InjectRepository(PanelModelOrmEntity)
    private readonly repo: Repository<PanelModelOrmEntity>,
  ) {}

  async findById(id: string, tenantId: string): Promise<PanelModel | null> {
    const orm = await this.repo.findOne({ where: { id, tenantId } });
    return orm ? PanelModelMapper.toDomain(orm) : null;
  }

  async findAllByTenant(tenantId: string, status?: CatalogStatus): Promise<PanelModel[]> {
    const where: Record<string, unknown> = { tenantId };
    if (status) where['status'] = status;
    const orms = await this.repo.find({ where, order: { brand: 'ASC', modelName: 'ASC' } });
    return orms.map(PanelModelMapper.toDomain);
  }

  async save(panel: PanelModel): Promise<void> {
    await this.repo.save(PanelModelMapper.toOrm(panel));
  }
}
