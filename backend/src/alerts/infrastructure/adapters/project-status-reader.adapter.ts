import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectOrmEntity } from '../../../project-client/infrastructure/persistence/project.orm-entity';
import type { ProjectStatusReaderPort } from '../../application/use-cases/create-alert-policy.use-case';

@Injectable()
export class ProjectStatusReaderAdapter implements ProjectStatusReaderPort {
  constructor(
    @InjectRepository(ProjectOrmEntity)
    private readonly ormRepo: Repository<ProjectOrmEntity>,
  ) {}

  async getStatus(projectId: string, tenantId: string): Promise<string | null> {
    const project = await this.ormRepo.findOne({ where: { id: projectId, tenantId } });
    return project?.status ?? null;
  }
}
