import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../shared/errors';
import { PANEL_MODEL_REPOSITORY } from '../../domain/repositories/panel-model.repository';
import type { PanelModelRepository } from '../../domain/repositories/panel-model.repository';
import type { PanelOutput } from '../dto/catalog.dto';
import { toPanelOutput } from './catalog-output.helper';

@Injectable()
export class DiscontinuePanelUseCase {
  constructor(
    @Inject(PANEL_MODEL_REPOSITORY) private readonly repo: PanelModelRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<PanelOutput> {
    const panel = await this.repo.findById(id, tenantId);
    if (!panel) throw new NotFoundError('PanelModel', id);
    panel.discontinue();
    await this.repo.save(panel);
    return toPanelOutput(panel);
  }
}
