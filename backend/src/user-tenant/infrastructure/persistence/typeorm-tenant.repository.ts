import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../domain/entities/tenant.entity';
import { TenantRepository } from '../../domain/repositories/tenant.repository';
import { TenantMapper } from './tenant.mapper';
import { TenantOrmEntity } from './tenant.orm-entity';

@Injectable()
export class TypeOrmTenantRepository implements TenantRepository {
  constructor(
    @InjectRepository(TenantOrmEntity)
    private readonly repo: Repository<TenantOrmEntity>,
  ) {}

  async findById(id: string): Promise<Tenant | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? TenantMapper.toDomain(row) : null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const row = await this.repo.findOne({ where: { slug } });
    return row ? TenantMapper.toDomain(row) : null;
  }

  async save(tenant: Tenant): Promise<void> {
    await this.repo.save(TenantMapper.toOrm(tenant));
  }
}
