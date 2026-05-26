import type { PanelModel } from '../entities/panel-model.entity';
import type { CatalogStatus } from '../value-objects/catalog-status.enum';

export interface PanelModelRepository {
  findById(id: string, tenantId: string): Promise<PanelModel | null>;
  findAllByTenant(tenantId: string, status?: CatalogStatus): Promise<PanelModel[]>;
  save(panel: PanelModel): Promise<void>;
}

export const PANEL_MODEL_REPOSITORY = 'PANEL_MODEL_REPOSITORY';
