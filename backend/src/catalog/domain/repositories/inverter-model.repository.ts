import type { InverterModel } from '../entities/inverter-model.entity';
import type { CatalogStatus } from '../value-objects/catalog-status.enum';

export interface InverterModelRepository {
  findById(id: string, tenantId: string): Promise<InverterModel | null>;
  findAllByTenant(tenantId: string, status?: CatalogStatus): Promise<InverterModel[]>;
  save(inverter: InverterModel): Promise<void>;
}

export const INVERTER_MODEL_REPOSITORY = 'INVERTER_MODEL_REPOSITORY';
