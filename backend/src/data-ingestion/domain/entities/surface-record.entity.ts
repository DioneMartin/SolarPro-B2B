import { LatLon } from '../value-objects/lat-lon.vo';

interface CreateSurfaceRecordProps {
  id: string;
  tenantId: string;
  projectId: string;
  inputAddress?: string;
  coordinates: LatLon;
  rawApiResponse: unknown;
  estimatedUsableSqMeters: number;
  annualIrradiationKwhPerSqM: number;
}

interface RehydrateSurfaceRecordProps {
  id: string;
  tenantId: string;
  projectId: string;
  inputAddress?: string;
  coordinates: LatLon;
  rawApiResponse: unknown;
  estimatedUsableSqMeters: number;
  annualIrradiationKwhPerSqM: number;
  manualOverride: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class SurfaceRecord {
  private constructor(
    readonly id: string,
    readonly tenantId: string,
    readonly projectId: string,
    readonly inputAddress: string | undefined,
    readonly coordinates: LatLon,
    readonly rawApiResponse: unknown,
    private _estimatedUsableSqMeters: number,
    readonly annualIrradiationKwhPerSqM: number,
    private _manualOverride: boolean,
    readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static create(props: CreateSurfaceRecordProps): SurfaceRecord {
    if (!props.inputAddress && !props.coordinates) {
      throw new Error('At least one of address or coordinates must be provided');
    }
    const now = new Date();
    return new SurfaceRecord(
      props.id,
      props.tenantId,
      props.projectId,
      props.inputAddress,
      props.coordinates,
      props.rawApiResponse,
      props.estimatedUsableSqMeters,
      props.annualIrradiationKwhPerSqM,
      false, // Initially not manually overridden
      now,
      now,
    );
  }

  static rehydrate(props: RehydrateSurfaceRecordProps): SurfaceRecord {
    return new SurfaceRecord(
      props.id,
      props.tenantId,
      props.projectId,
      props.inputAddress,
      props.coordinates,
      props.rawApiResponse,
      props.estimatedUsableSqMeters,
      props.annualIrradiationKwhPerSqM,
      props.manualOverride,
      props.createdAt,
      props.updatedAt,
    );
  }

  get estimatedUsableSqMeters(): number {
    return this._estimatedUsableSqMeters;
  }

  get manualOverride(): boolean {
    return this._manualOverride;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  overrideUsableArea(sqMeters: number): void {
    if (sqMeters < 0) throw new Error('Usable area cannot be negative');
    this._estimatedUsableSqMeters = sqMeters;
    this._manualOverride = true;
    this._updatedAt = new Date();
  }
}
