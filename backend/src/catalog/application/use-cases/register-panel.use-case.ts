import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PanelModel } from '../../domain/entities/panel-model.entity';
import { CATALOG_ALIAS_REPOSITORY } from '../../domain/repositories/catalog-alias.repository';
import type { CatalogAliasRepository } from '../../domain/repositories/catalog-alias.repository';
import { PANEL_MODEL_REPOSITORY } from '../../domain/repositories/panel-model.repository';
import type { PanelModelRepository } from '../../domain/repositories/panel-model.repository';
import { SpecNormalizer } from '../../domain/services/spec-normalizer';
import type { PanelOutput, RegisterPanelInput } from '../dto/catalog.dto';
import { toPanelOutput } from './catalog-output.helper';

@Injectable()
export class RegisterPanelUseCase {
  constructor(
    @Inject(PANEL_MODEL_REPOSITORY) private readonly repo: PanelModelRepository,
    @Inject(CATALOG_ALIAS_REPOSITORY) private readonly aliasRepo: CatalogAliasRepository,
    private readonly normalizer: SpecNormalizer,
  ) {}

  async execute(input: RegisterPanelInput): Promise<PanelOutput> {
    const aliasConfig = await this.aliasRepo.findByTenant(input.tenantId);
    const tenantAliases = aliasConfig?.panels ?? {};
    const normalizedSpecs = this.normalizer.normalizePanel(input.specs, tenantAliases, input.mapping ?? {});

    const panel = PanelModel.create({
      id: uuidv4(),
      tenantId: input.tenantId,
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
