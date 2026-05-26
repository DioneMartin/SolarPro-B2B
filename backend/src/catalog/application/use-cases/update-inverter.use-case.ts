import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../shared/errors';
import { CATALOG_ALIAS_REPOSITORY } from '../../domain/repositories/catalog-alias.repository';
import type { CatalogAliasRepository } from '../../domain/repositories/catalog-alias.repository';
import { INVERTER_MODEL_REPOSITORY } from '../../domain/repositories/inverter-model.repository';
import type { InverterModelRepository } from '../../domain/repositories/inverter-model.repository';
import { SpecNormalizer } from '../../domain/services/spec-normalizer';
import type { InverterOutput, UpdateInverterInput } from '../dto/catalog.dto';
import { toInverterOutput } from './catalog-output.helper';

@Injectable()
export class UpdateInverterUseCase {
  constructor(
    @Inject(INVERTER_MODEL_REPOSITORY) private readonly repo: InverterModelRepository,
    @Inject(CATALOG_ALIAS_REPOSITORY) private readonly aliasRepo: CatalogAliasRepository,
    private readonly normalizer: SpecNormalizer,
  ) {}

  async execute(input: UpdateInverterInput): Promise<InverterOutput> {
    const inverter = await this.repo.findById(input.id, input.tenantId);
    if (!inverter) throw new NotFoundError('InverterModel', input.id);

    const newRawSpecs = input.specs ?? inverter.rawSpecs;
    const aliasConfig = await this.aliasRepo.findByTenant(input.tenantId);
    const tenantAliases = aliasConfig?.inverters ?? {};
    const normalizedSpecs = this.normalizer.normalizeInverter(newRawSpecs, tenantAliases, input.mapping ?? {});

    inverter.update({ brand: input.brand, modelName: input.modelName, rawSpecs: input.specs, normalizedSpecs, unitCost: input.unitCost });
    await this.repo.save(inverter);
    return toInverterOutput(inverter);
  }
}
