import { InverterModel } from '../../domain/entities/inverter-model.entity';
import type { InverterSpec } from '../../../shared/types/panel-spec';
import { CatalogStatus } from '../../domain/value-objects/catalog-status.enum';
import { InverterModelOrmEntity } from './inverter-model.orm-entity';

export class InverterModelMapper {
  static toDomain(orm: InverterModelOrmEntity): InverterModel {
    return InverterModel.rehydrate({
      id: orm.id,
      tenantId: orm.tenantId,
      brand: orm.brand,
      modelName: orm.modelName,
      rawSpecs: orm.rawSpecs,
      normalizedSpecs: orm.normalizedSpecs as unknown as InverterSpec,
      unitCost: orm.unitCost,
      status: orm.status as CatalogStatus,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(i: InverterModel): InverterModelOrmEntity {
    const orm = new InverterModelOrmEntity();
    orm.id = i.id;
    orm.tenantId = i.tenantId;
    orm.brand = i.brand;
    orm.modelName = i.modelName;
    orm.rawSpecs = i.rawSpecs;
    orm.normalizedSpecs = i.normalizedSpecs as unknown as Record<string, unknown>;
    orm.unitCost = i.unitCost.toPlain();
    orm.status = i.status;
    return orm;
  }
}
