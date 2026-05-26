export interface CatalogAlias {
  tenantId: string;
  panels: Record<string, string>;
  inverters: Record<string, string>;
}

export interface CatalogAliasRepository {
  findByTenant(tenantId: string): Promise<CatalogAlias | null>;
  save(alias: CatalogAlias): Promise<void>;
}

export const CATALOG_ALIAS_REPOSITORY = 'CATALOG_ALIAS_REPOSITORY';
