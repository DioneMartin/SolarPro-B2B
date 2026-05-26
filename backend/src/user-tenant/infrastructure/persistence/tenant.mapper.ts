import { Tenant } from '../../domain/entities/tenant.entity';
import { TenantStatus } from '../../domain/value-objects/tenant-status.enum';
import { TenantOrmEntity } from './tenant.orm-entity';

export class TenantMapper {
  static toDomain(orm: TenantOrmEntity): Tenant {
    return Tenant.rehydrate({
      id: orm.id,
      name: orm.name,
      slug: orm.slug,
      status: orm.status as TenantStatus,
      createdAt: orm.createdAt,
    });
  }

  static toOrm(domain: Tenant): TenantOrmEntity {
    const orm = new TenantOrmEntity();
    orm.id = domain.id;
    orm.name = domain.name;
    orm.slug = domain.slug;
    orm.status = domain.status;
    return orm;
  }
}
