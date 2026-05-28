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

  async getCoords(
    projectId: string,
    tenantId: string,
  ): Promise<{ lat: number; lon: number } | null> {
    const project = await this.ormRepo.findOne({ where: { id: projectId, tenantId } });
    if (!project || project.siteAddressLat == null || project.siteAddressLon == null) {
      return null;
    }
    return { lat: project.siteAddressLat, lon: project.siteAddressLon };
  }
}
