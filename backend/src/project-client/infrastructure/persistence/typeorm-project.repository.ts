import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Project } from '../../domain/entities/project.entity';
import type { ProjectRepository } from '../../domain/repositories/project.repository';
import { ProjectStatus } from '../../domain/value-objects/project-status.enum';
import { ProjectMapper } from './project.mapper';
import { ProjectOrmEntity } from './project.orm-entity';

@Injectable()
export class TypeOrmProjectRepository implements ProjectRepository {
  constructor(
    @InjectRepository(ProjectOrmEntity)
    private readonly repo: Repository<ProjectOrmEntity>,
  ) {}

  async findById(id: string, tenantId: string): Promise<Project | null> {
    const orm = await this.repo.findOne({ where: { id, tenantId } });
    return orm ? ProjectMapper.toDomain(orm) : null;
  }

  async findAllByTenant(tenantId: string, filters?: { clientId?: string; status?: ProjectStatus }): Promise<Project[]> {
    const qb = this.repo.createQueryBuilder('p').where('p.tenant_id = :tenantId', { tenantId });
    if (filters?.clientId) qb.andWhere('p.client_id = :clientId', { clientId: filters.clientId });
    if (filters?.status) qb.andWhere('p.status = :status', { status: filters.status });
    qb.orderBy('p.updated_at', 'DESC');
    const orms = await qb.getMany();
    return orms.map(ProjectMapper.toDomain);
  }

  async countByStatus(tenantId: string): Promise<Record<string, number>> {
    const rows = await this.repo
      .createQueryBuilder('p')
      .select('p.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('p.tenant_id = :tenantId', { tenantId })
      .groupBy('p.status')
      .getRawMany<{ status: string; count: string }>();

    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.status] = Number(row.count);
    }
    return result;
  }

  async save(project: Project): Promise<void> {
    await this.repo.save(ProjectMapper.toOrm(project));
  }
}
