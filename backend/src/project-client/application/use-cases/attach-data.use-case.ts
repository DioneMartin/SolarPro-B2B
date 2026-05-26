import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../shared/errors';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository';
import type { ProjectRepository } from '../../domain/repositories/project.repository';
import type { ProjectOutput } from '../dto/project.dto';
import { toProjectOutput } from './project-output.helper';

@Injectable()
export class AttachConsumptionUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY) private readonly repo: ProjectRepository,
  ) {}

  async execute(projectId: string, tenantId: string, consumptionRefId: string): Promise<ProjectOutput> {
    const project = await this.repo.findById(projectId, tenantId);
    if (!project) throw new NotFoundError('Project', projectId);
    project.attachConsumption(consumptionRefId);
    await this.repo.save(project);
    return toProjectOutput(project);
  }
}

@Injectable()
export class AttachSurfaceUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY) private readonly repo: ProjectRepository,
  ) {}

  async execute(projectId: string, tenantId: string, surfaceRefId: string): Promise<ProjectOutput> {
    const project = await this.repo.findById(projectId, tenantId);
    if (!project) throw new NotFoundError('Project', projectId);
    project.attachSurface(surfaceRefId);
    await this.repo.save(project);
    return toProjectOutput(project);
  }
}
