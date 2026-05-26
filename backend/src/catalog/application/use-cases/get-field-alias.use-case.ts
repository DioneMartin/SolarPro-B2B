import { Inject, Injectable } from '@nestjs/common';
import { CATALOG_ALIAS_REPOSITORY } from '../../domain/repositories/catalog-alias.repository';
import type { CatalogAliasRepository } from '../../domain/repositories/catalog-alias.repository';
import type { AliasOutput } from '../dto/catalog.dto';

@Injectable()
export class GetFieldAliasUseCase {
  constructor(
    @Inject(CATALOG_ALIAS_REPOSITORY) private readonly repo: CatalogAliasRepository,
  ) {}

  async execute(tenantId: string): Promise<AliasOutput> {
    const alias = await this.repo.findByTenant(tenantId);
    return alias ?? { tenantId, panels: {}, inverters: {} };
  }
}
