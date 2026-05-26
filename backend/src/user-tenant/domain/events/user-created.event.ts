import { UserRole } from '../value-objects/user-role.enum';

export class UserCreatedEvent {
  constructor(
    readonly userId: string,
    readonly tenantId: string,
    readonly role: UserRole,
    readonly createdAt: Date,
  ) {}
}
