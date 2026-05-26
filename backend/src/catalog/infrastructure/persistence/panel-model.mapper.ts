import { PanelModel } from '../../domain/entities/panel-model.entity';
import type { PanelSpec } from '../../../shared/types/panel-spec';
import { CatalogStatus } from '../../domain/value-objects/catalog-status.enum';
import { PanelModelOrmEntity } from './panel-model.orm-entity';

export class PanelModelMapper {
  static toDomain(orm: PanelModelOrmEntity): PanelModel {
    return PanelModel.rehydrate({
      id: orm.id,
      tenantId: orm.tenantId,
      brand: orm.brand,
      modelName: orm.modelName,
      rawSpecs: orm.rawSpecs,
      normalizedSpecs: orm.normalizedSpecs as unknown as PanelSpec,
      unitCost: orm.unitCost,
      status: orm.status as CatalogStatus,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(p: PanelModel): PanelModelOrmEntity {
    const orm = new PanelModelOrmEntity();
    orm.id = p.id;
    orm.tenantId = p.tenantId;
    orm.brand = p.brand;
    orm.modelName = p.modelName;
    orm.rawSpecs = p.rawSpecs;
    orm.normalizedSpecs = p.normalizedSpecs as unknown as Record<string, unknown>;
    orm.unitCost = p.unitCost.toPlain();
    orm.status = p.status;
    return orm;
  }
}
