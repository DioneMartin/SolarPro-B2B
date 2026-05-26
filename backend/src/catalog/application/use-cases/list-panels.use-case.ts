import { Inject, Injectable } from '@nestjs/common';
import { CatalogStatus } from '../../domain/value-objects/catalog-status.enum';
import { PANEL_MODEL_REPOSITORY } from '../../domain/repositories/panel-model.repository';
import type { PanelModelRepository } from '../../domain/repositories/panel-model.repository';
import type { PanelOutput } from '../dto/catalog.dto';
import { toPanelOutput } from './catalog-output.helper';

@Injectable()
export class ListPanelsUseCase {
  constructor(
    @Inject(PANEL_MODEL_REPOSITORY) private readonly repo: PanelModelRepository,
  ) {}

  async execute(tenantId: string, activeOnly = true): Promise<PanelOutput[]> {
    const status = activeOnly ? CatalogStatus.ACTIVE : undefined;
    const panels = await this.repo.findAllByTenant(tenantId, status);
    return panels.map(toPanelOutput);
  }
}
