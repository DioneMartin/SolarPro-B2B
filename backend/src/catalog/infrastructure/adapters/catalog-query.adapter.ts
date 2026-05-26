import { Inject, Injectable } from '@nestjs/common';
import type { InverterCatalogItem, PanelCatalogItem } from '../../../shared/types/catalog-query.port';
import { CatalogStatus } from '../../domain/value-objects/catalog-status.enum';
import { INVERTER_MODEL_REPOSITORY } from '../../domain/repositories/inverter-model.repository';
import type { InverterModelRepository } from '../../domain/repositories/inverter-model.repository';
import { PANEL_MODEL_REPOSITORY } from '../../domain/repositories/panel-model.repository';
import type { PanelModelRepository } from '../../domain/repositories/panel-model.repository';
import type { CatalogQueryPort } from '../../../shared/types/catalog-query.port';

@Injectable()
export class CatalogQueryAdapter implements CatalogQueryPort {
  constructor(
    @Inject(PANEL_MODEL_REPOSITORY) private readonly panelRepo: PanelModelRepository,
    @Inject(INVERTER_MODEL_REPOSITORY) private readonly inverterRepo: InverterModelRepository,
  ) {}

  async listActivePanels(tenantId: string): Promise<PanelCatalogItem[]> {
    const panels = await this.panelRepo.findAllByTenant(tenantId, CatalogStatus.ACTIVE);
    return panels.map(p => ({
      id: p.id,
      brand: p.brand,
      modelName: p.modelName,
      spec: p.normalizedSpecs,
      unitCost: p.unitCost.toPlain(),
    }));
  }

  async listActiveInverters(tenantId: string): Promise<InverterCatalogItem[]> {
    const inverters = await this.inverterRepo.findAllByTenant(tenantId, CatalogStatus.ACTIVE);
    return inverters.map(i => ({
      id: i.id,
      brand: i.brand,
      modelName: i.modelName,
      spec: i.normalizedSpecs,
      unitCost: i.unitCost.toPlain(),
    }));
  }
}
