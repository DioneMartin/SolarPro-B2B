import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { CatalogAlias, CatalogAliasRepository } from '../../domain/repositories/catalog-alias.repository';
import { CatalogAliasOrmEntity } from './catalog-alias.orm-entity';

@Injectable()
export class TypeOrmCatalogAliasRepository implements CatalogAliasRepository {
  constructor(
    @InjectRepository(CatalogAliasOrmEntity)
    private readonly repo: Repository<CatalogAliasOrmEntity>,
  ) {}

  async findByTenant(tenantId: string): Promise<CatalogAlias | null> {
    const orm = await this.repo.findOne({ where: { tenantId } });
    return orm ? { tenantId: orm.tenantId, panels: orm.panels, inverters: orm.inverters } : null;
  }

  async save(alias: CatalogAlias): Promise<void> {
    await this.repo.save({ tenantId: alias.tenantId, panels: alias.panels, inverters: alias.inverters });
  }
}
