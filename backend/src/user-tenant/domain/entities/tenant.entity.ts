import { TenantStatus } from '../value-objects/tenant-status.enum';

interface CreateTenantProps {
  id: string;
  name: string;
  slug: string;
}

interface RehydrateTenantProps {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  createdAt: Date;
}

export class Tenant {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly slug: string,
    private _status: TenantStatus,
    readonly createdAt: Date,
  ) {}

  static create(props: CreateTenantProps): Tenant {
    return new Tenant(
      props.id,
      props.name.trim(),
      props.slug.toLowerCase().trim(),
      TenantStatus.ACTIVE,
      new Date(),
    );
  }

  static rehydrate(props: RehydrateTenantProps): Tenant {
    return new Tenant(
      props.id,
      props.name,
      props.slug,
      props.status,
      props.createdAt,
    );
  }

  get status(): TenantStatus {
    return this._status;
  }

  isActive(): boolean {
    return this._status === TenantStatus.ACTIVE;
  }
}
