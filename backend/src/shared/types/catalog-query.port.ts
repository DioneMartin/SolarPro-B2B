import type { InverterSpec, PanelSpec } from './panel-spec';

export interface Money {
  amount: number;
  currency: string;
}

export interface PanelCatalogItem {
  id: string;
  brand: string;
  modelName: string;
  spec: PanelSpec;
  unitCost: Money;
}

export interface InverterCatalogItem {
  id: string;
  brand: string;
  modelName: string;
  spec: InverterSpec;
  unitCost: Money;
}

export interface CatalogQueryPort {
  listActivePanels(tenantId: string): Promise<PanelCatalogItem[]>;
  listActiveInverters(tenantId: string): Promise<InverterCatalogItem[]>;
}

export const CATALOG_QUERY_PORT = 'CATALOG_QUERY_PORT';
