import { Inject, Injectable } from '@nestjs/common';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository';
import type { ProjectRepository } from '../../domain/repositories/project.repository';
import { ProjectStatus } from '../../domain/value-objects/project-status.enum';
import type { ProjectOutput } from '../dto/project.dto';
import { toProjectOutput } from './project-output.helper';

export interface ListProjectsInput {
  tenantId: string;
  clientId?: string;
  status?: ProjectStatus;
}

@Injectable()
export class ListProjectsUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY) private readonly repo: ProjectRepository,
  ) {}

  async execute(input: ListProjectsInput): Promise<ProjectOutput[]> {
    const projects = await this.repo.findAllByTenant(input.tenantId, {
      clientId: input.clientId,
      status: input.status,
    });
    return projects.map(toProjectOutput);
  }
}
