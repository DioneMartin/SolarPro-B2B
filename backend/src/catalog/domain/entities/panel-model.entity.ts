import type { PanelSpec } from '../../../shared/types/panel-spec';
import { CatalogStatus } from '../value-objects/catalog-status.enum';
import { Money, MoneyProps } from '../value-objects/money.vo';

interface CreatePanelProps {
  id: string;
  tenantId: string;
  brand: string;
  modelName: string;
  rawSpecs: Record<string, unknown>;
  normalizedSpecs: PanelSpec;
  unitCost: MoneyProps;
}

interface RehydratePanelProps extends CreatePanelProps {
  status: CatalogStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class PanelModel {
  private constructor(
    readonly id: string,
    readonly tenantId: string,
    private _brand: string,
    private _modelName: string,
    private _rawSpecs: Record<string, unknown>,
    private _normalizedSpecs: PanelSpec,
    private _unitCost: Money,
    private _status: CatalogStatus,
    readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static create(props: CreatePanelProps): PanelModel {
    const now = new Date();
    return new PanelModel(
      props.id, props.tenantId,
      props.brand.trim(), props.modelName.trim(),
      props.rawSpecs, props.normalizedSpecs,
      Money.create(props.unitCost),
      CatalogStatus.ACTIVE, now, now,
    );
  }

  static rehydrate(props: RehydratePanelProps): PanelModel {
    return new PanelModel(
      props.id, props.tenantId,
      props.brand, props.modelName,
      props.rawSpecs, props.normalizedSpecs,
      Money.create(props.unitCost),
      props.status, props.createdAt, props.updatedAt,
    );
  }

  get brand(): string { return this._brand; }
  get modelName(): string { return this._modelName; }
  get rawSpecs(): Record<string, unknown> { return this._rawSpecs; }
  get normalizedSpecs(): PanelSpec { return this._normalizedSpecs; }
  get unitCost(): Money { return this._unitCost; }
  get status(): CatalogStatus { return this._status; }
  get updatedAt(): Date { return this._updatedAt; }

  update(changes: { brand?: string; modelName?: string; rawSpecs?: Record<string, unknown>; normalizedSpecs?: PanelSpec; unitCost?: MoneyProps }): void {
    if (changes.brand !== undefined) this._brand = changes.brand.trim();
    if (changes.modelName !== undefined) this._modelName = changes.modelName.trim();
    if (changes.rawSpecs !== undefined) this._rawSpecs = changes.rawSpecs;
    if (changes.normalizedSpecs !== undefined) this._normalizedSpecs = changes.normalizedSpecs;
    if (changes.unitCost !== undefined) this._unitCost = Money.create(changes.unitCost);
    this._updatedAt = new Date();
  }

  discontinue(): void {
    this._status = CatalogStatus.DISCONTINUED;
    this._updatedAt = new Date();
  }
}
