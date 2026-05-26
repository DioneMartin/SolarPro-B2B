import { LastAdminError } from '../errors/last-admin.error';
import { Email } from '../value-objects/email.vo';
import { UserRole } from '../value-objects/user-role.enum';
import { UserStatus } from '../value-objects/user-status.enum';

interface CreateUserProps {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
}

interface RehydrateUserProps {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
}

export class User {
  private constructor(
    readonly id: string,
    readonly tenantId: string,
    readonly email: Email,
    private _passwordHash: string,
    readonly fullName: string,
    private _role: UserRole,
    private _status: UserStatus,
    readonly createdAt: Date,
  ) {}

  static create(props: CreateUserProps): User {
    return new User(
      props.id,
      props.tenantId,
      Email.create(props.email),
      props.passwordHash,
      props.fullName.trim(),
      props.role,
      UserStatus.ACTIVE,
      new Date(),
    );
  }

  static rehydrate(props: RehydrateUserProps): User {
    return new User(
      props.id,
      props.tenantId,
      Email.create(props.email),
      props.passwordHash,
      props.fullName,
      props.role,
      props.status,
      props.createdAt,
    );
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  get role(): UserRole {
    return this._role;
  }

  get status(): UserStatus {
    return this._status;
  }

  isActive(): boolean {
    return this._status === UserStatus.ACTIVE;
  }

  isAdmin(): boolean {
    return this._role === UserRole.TENANT_ADMIN;
  }

  changeRole(newRole: UserRole, activeAdminCount: number): void {
    if (this.isAdmin() && newRole !== UserRole.TENANT_ADMIN && activeAdminCount <= 1) {
      throw new LastAdminError();
    }
    this._role = newRole;
  }

  disable(activeAdminCount: number): void {
    if (this.isAdmin() && activeAdminCount <= 1) {
      throw new LastAdminError();
    }
    this._status = UserStatus.DISABLED;
  }
}
