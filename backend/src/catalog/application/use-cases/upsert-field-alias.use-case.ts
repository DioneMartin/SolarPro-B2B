import { Inject, Injectable } from '@nestjs/common';
import { CATALOG_ALIAS_REPOSITORY } from '../../domain/repositories/catalog-alias.repository';
import type { CatalogAliasRepository } from '../../domain/repositories/catalog-alias.repository';
import type { AliasOutput } from '../dto/catalog.dto';

@Injectable()
export class UpsertFieldAliasUseCase {
  constructor(
    @Inject(CATALOG_ALIAS_REPOSITORY) private readonly repo: CatalogAliasRepository,
  ) {}

  async execute(tenantId: string, panels: Record<string, string>, inverters: Record<string, string>): Promise<AliasOutput> {
    const alias = { tenantId, panels, inverters };
    await this.repo.save(alias);
    return alias;
  }
}
