import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../shared/errors';
import { CATALOG_ALIAS_REPOSITORY } from '../../domain/repositories/catalog-alias.repository';
import type { CatalogAliasRepository } from '../../domain/repositories/catalog-alias.repository';
import { PANEL_MODEL_REPOSITORY } from '../../domain/repositories/panel-model.repository';
import type { PanelModelRepository } from '../../domain/repositories/panel-model.repository';
import { SpecNormalizer } from '../../domain/services/spec-normalizer';
import type { PanelOutput, UpdatePanelInput } from '../dto/catalog.dto';
import { toPanelOutput } from './catalog-output.helper';

@Injectable()
export class UpdatePanelUseCase {
  constructor(
    @Inject(PANEL_MODEL_REPOSITORY) private readonly repo: PanelModelRepository,
    @Inject(CATALOG_ALIAS_REPOSITORY) private readonly aliasRepo: CatalogAliasRepository,
    private readonly normalizer: SpecNormalizer,
  ) {}

  async execute(input: UpdatePanelInput): Promise<PanelOutput> {
    const panel = await this.repo.findById(input.id, input.tenantId);
    if (!panel) throw new NotFoundError('PanelModel', input.id);

    const newRawSpecs = input.specs ?? panel.rawSpecs;

    const aliasConfig = await this.aliasRepo.findByTenant(input.tenantId);
    const tenantAliases = aliasConfig?.panels ?? {};
    const normalizedSpecs = this.normalizer.normalizePanel(newRawSpecs, tenantAliases, input.mapping ?? {});

    panel.update({
      brand: input.brand,
      modelName: input.modelName,
      rawSpecs: input.specs,
      normalizedSpecs,
      unitCost: input.unitCost,
    });

    await this.repo.save(panel);
    return toPanelOutput(panel);
  }
}
