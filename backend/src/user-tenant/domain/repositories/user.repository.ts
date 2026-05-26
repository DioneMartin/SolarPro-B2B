import { User } from '../entities/user.entity';
import { UserRole } from '../value-objects/user-role.enum';

export interface UserRepository {
  findById(id: string, tenantId: string): Promise<User | null>;
  findByEmail(email: string, tenantId: string): Promise<User | null>;
  findByEmailAcrossTenants(email: string): Promise<User | null>;
  findAllByTenant(tenantId: string): Promise<User[]>;
  countActiveAdmins(tenantId: string): Promise<number>;
  findActiveAdmins(tenantId: string, role: UserRole): Promise<User[]>;
  save(user: User): Promise<void>;
}

export const USER_REPOSITORY = 'USER_REPOSITORY';
