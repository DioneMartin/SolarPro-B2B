import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/value-objects/user-role.enum';
import { UserStatus } from '../../domain/value-objects/user-status.enum';
import { UserOrmEntity } from './user.orm-entity';

export class UserMapper {
  static toDomain(orm: UserOrmEntity): User {
    return User.rehydrate({
      id: orm.id,
      tenantId: orm.tenantId,
      email: orm.email,
      passwordHash: orm.passwordHash,
      fullName: orm.fullName,
      role: orm.role as UserRole,
      status: orm.status as UserStatus,
      createdAt: orm.createdAt,
    });
  }

  static toOrm(domain: User): UserOrmEntity {
    const orm = new UserOrmEntity();
    orm.id = domain.id;
    orm.tenantId = domain.tenantId;
    orm.email = domain.email.value;
    orm.passwordHash = domain.passwordHash;
    orm.fullName = domain.fullName;
    orm.role = domain.role;
    orm.status = domain.status;
    return orm;
  }
}
