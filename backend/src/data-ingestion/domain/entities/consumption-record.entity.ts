import { MonthlyKwh } from '../value-objects/monthly-kwh.vo';
import { Tariff } from '../value-objects/tariff.vo';
import { ConsumptionSource } from '../value-objects/consumption-source.enum';
import { ConsumptionStatus } from '../value-objects/consumption-status.enum';

interface CreateConsumptionRecordProps {
  id: string;
  tenantId: string;
  projectId: string;
  source: ConsumptionSource;
  status: ConsumptionStatus;
  rawFileRef?: string;
  tariff?: Tariff;
  months?: MonthlyKwh[];
  notes?: string;
}

interface RehydrateConsumptionRecordProps {
  id: string;
  tenantId: string;
  projectId: string;
  source: ConsumptionSource;
  status: ConsumptionStatus;
  rawFileRef?: string;
  tariff?: Tariff;
  months: MonthlyKwh[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ConsumptionRecord {
  private constructor(
    readonly id: string,
    readonly tenantId: string,
    readonly projectId: string,
    readonly source: ConsumptionSource,
    private _status: ConsumptionStatus,
    readonly rawFileRef: string | undefined,
    private _tariff: Tariff | undefined,
    private _months: MonthlyKwh[],
    private _notes: string | undefined,
    readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static create(props: CreateConsumptionRecordProps): ConsumptionRecord {
    const now = new Date();
    return new ConsumptionRecord(
      props.id,
      props.tenantId,
      props.projectId,
      props.source,
      props.status,
      props.rawFileRef,
      props.tariff,
      props.months || [],
      props.notes,
      now,
      now,
    );
  }

  static rehydrate(props: RehydrateConsumptionRecordProps): ConsumptionRecord {
    return new ConsumptionRecord(
      props.id,
      props.tenantId,
      props.projectId,
      props.source,
      props.status,
      props.rawFileRef,
      props.tariff,
      props.months,
      props.notes,
      props.createdAt,
      props.updatedAt,
    );
  }

  get status(): ConsumptionStatus {
    return this._status;
  }

  get tariff(): Tariff | undefined {
    return this._tariff;
  }

  get months(): MonthlyKwh[] {
    return [...this._months];
  }

  get notes(): string | undefined {
    return this._notes;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  isValidForCalculation(): boolean {
    return this._months.length >= 3 && this._status === ConsumptionStatus.READY;
  }

  updateMonths(months: MonthlyKwh[]): void {
    this._months = months;
    this._updatedAt = new Date();
  }

  updateTariff(tariff: Tariff | undefined): void {
    this._tariff = tariff;
    this._updatedAt = new Date();
  }

  updateNotes(notes: string | undefined): void {
    this._notes = notes;
    this._updatedAt = new Date();
  }

  markAsReady(): void {
    this._status = ConsumptionStatus.READY;
    this._updatedAt = new Date();
  }

  markAsFailed(): void {
    this._status = ConsumptionStatus.FAILED;
    this._updatedAt = new Date();
  }
}
