import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { InverterModel } from '../../domain/entities/inverter-model.entity';
import { CATALOG_ALIAS_REPOSITORY } from '../../domain/repositories/catalog-alias.repository';
import type { CatalogAliasRepository } from '../../domain/repositories/catalog-alias.repository';
import { INVERTER_MODEL_REPOSITORY } from '../../domain/repositories/inverter-model.repository';
import type { InverterModelRepository } from '../../domain/repositories/inverter-model.repository';
import { SpecNormalizer } from '../../domain/services/spec-normalizer';
import type { InverterOutput, RegisterInverterInput } from '../dto/catalog.dto';
import { toInverterOutput } from './catalog-output.helper';

@Injectable()
export class RegisterInverterUseCase {
  constructor(
    @Inject(INVERTER_MODEL_REPOSITORY) private readonly repo: InverterModelRepository,
    @Inject(CATALOG_ALIAS_REPOSITORY) private readonly aliasRepo: CatalogAliasRepository,
    private readonly normalizer: SpecNormalizer,
  ) {}

  async execute(input: RegisterInverterInput): Promise<InverterOutput> {
    const aliasConfig = await this.aliasRepo.findByTenant(input.tenantId);
    const tenantAliases = aliasConfig?.inverters ?? {};
    const normalizedSpecs = this.normalizer.normalizeInverter(input.specs, tenantAliases, input.mapping ?? {});

    const inverter = InverterModel.create({
      id: uuidv4(),
      tenantId: input.tenantId,
      brand: input.brand,
      modelName: input.modelName,
      rawSpecs: input.specs,
      normalizedSpecs,
      unitCost: input.unitCost,
    });

    await this.repo.save(inverter);
    return toInverterOutput(inverter);
  }
}
