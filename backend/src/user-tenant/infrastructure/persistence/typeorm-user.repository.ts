import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UserRole } from '../../domain/value-objects/user-role.enum';
import { UserStatus } from '../../domain/value-objects/user-status.enum';
import { UserMapper } from './user.mapper';
import { UserOrmEntity } from './user.orm-entity';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) {}

  async findById(id: string, tenantId: string): Promise<User | null> {
    const row = await this.repo.findOne({ where: { id, tenantId } });
    return row ? UserMapper.toDomain(row) : null;
  }

  async findByEmail(email: string, tenantId: string): Promise<User | null> {
    const row = await this.repo.findOne({ where: { email, tenantId } });
    return row ? UserMapper.toDomain(row) : null;
  }

  async findByEmailAcrossTenants(email: string): Promise<User | null> {
    const row = await this.repo.findOne({ where: { email } });
    return row ? UserMapper.toDomain(row) : null;
  }

  async findAllByTenant(tenantId: string): Promise<User[]> {
    const rows = await this.repo.find({ where: { tenantId }, order: { createdAt: 'ASC' } });
    return rows.map(UserMapper.toDomain);
  }

  async countActiveAdmins(tenantId: string): Promise<number> {
    return this.repo.count({
      where: { tenantId, role: UserRole.TENANT_ADMIN, status: UserStatus.ACTIVE },
    });
  }

  async findActiveAdmins(tenantId: string, role: UserRole): Promise<User[]> {
    const rows = await this.repo.find({
      where: { tenantId, role, status: UserStatus.ACTIVE },
    });
    return rows.map(UserMapper.toDomain);
  }

  async save(user: User): Promise<void> {
    await this.repo.save(UserMapper.toOrm(user));
  }
}
