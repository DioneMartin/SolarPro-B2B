import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../shared/errors';
import { INVERTER_MODEL_REPOSITORY } from '../../domain/repositories/inverter-model.repository';
import type { InverterModelRepository } from '../../domain/repositories/inverter-model.repository';
import type { InverterOutput } from '../dto/catalog.dto';
import { toInverterOutput } from './catalog-output.helper';

@Injectable()
export class GetInverterUseCase {
  constructor(
    @Inject(INVERTER_MODEL_REPOSITORY) private readonly repo: InverterModelRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<InverterOutput> {
    const inverter = await this.repo.findById(id, tenantId);
    if (!inverter) throw new NotFoundError('InverterModel', id);
    return toInverterOutput(inverter);
  }
}
