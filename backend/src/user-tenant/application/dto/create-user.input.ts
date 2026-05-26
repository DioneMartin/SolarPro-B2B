import { UserRole } from '../../domain/value-objects/user-role.enum';

export interface CreateUserInput {
  tenantId: string;
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}
