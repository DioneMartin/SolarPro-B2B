import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Client } from '../../domain/entities/client.entity';
import type { ClientRepository } from '../../domain/repositories/client.repository';
import { ClientMapper } from './client.mapper';
import { ClientOrmEntity } from './client.orm-entity';

@Injectable()
export class TypeOrmClientRepository implements ClientRepository {
  constructor(
    @InjectRepository(ClientOrmEntity)
    private readonly repo: Repository<ClientOrmEntity>,
  ) {}

  async findById(id: string, tenantId: string): Promise<Client | null> {
    const orm = await this.repo.findOne({ where: { id, tenantId } });
    return orm ? ClientMapper.toDomain(orm) : null;
  }

  async findAllByTenant(tenantId: string): Promise<Client[]> {
    const orms = await this.repo.find({ where: { tenantId }, order: { displayName: 'ASC' } });
    return orms.map(ClientMapper.toDomain);
  }

  async save(client: Client): Promise<void> {
    await this.repo.save(ClientMapper.toOrm(client));
  }
}
