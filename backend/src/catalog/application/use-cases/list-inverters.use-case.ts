import { Inject, Injectable } from '@nestjs/common';
import { CatalogStatus } from '../../domain/value-objects/catalog-status.enum';
import { INVERTER_MODEL_REPOSITORY } from '../../domain/repositories/inverter-model.repository';
import type { InverterModelRepository } from '../../domain/repositories/inverter-model.repository';
import type { InverterOutput } from '../dto/catalog.dto';
import { toInverterOutput } from './catalog-output.helper';

@Injectable()
export class ListInvertersUseCase {
  constructor(
    @Inject(INVERTER_MODEL_REPOSITORY) private readonly repo: InverterModelRepository,
  ) {}

  async execute(tenantId: string, activeOnly = true): Promise<InverterOutput[]> {
    const status = activeOnly ? CatalogStatus.ACTIVE : undefined;
    const inverters = await this.repo.findAllByTenant(tenantId, status);
    return inverters.map(toInverterOutput);
  }
}
