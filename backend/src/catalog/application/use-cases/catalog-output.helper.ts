import type { InverterModel } from '../../domain/entities/inverter-model.entity';
import type { PanelModel } from '../../domain/entities/panel-model.entity';
import type { InverterOutput, PanelOutput } from '../dto/catalog.dto';

export function toPanelOutput(p: PanelModel): PanelOutput {
  return {
    id: p.id,
    tenantId: p.tenantId,
    brand: p.brand,
    modelName: p.modelName,
    rawSpecs: p.rawSpecs,
    normalizedSpecs: p.normalizedSpecs,
    unitCost: p.unitCost.toPlain(),
    status: p.status,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export function toInverterOutput(i: InverterModel): InverterOutput {
  return {
    id: i.id,
    tenantId: i.tenantId,
    brand: i.brand,
    modelName: i.modelName,
    rawSpecs: i.rawSpecs,
    normalizedSpecs: i.normalizedSpecs,
    unitCost: i.unitCost.toPlain(),
    status: i.status,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
  };
}
