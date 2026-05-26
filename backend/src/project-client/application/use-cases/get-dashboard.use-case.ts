import { Inject, Injectable } from '@nestjs/common';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository';
import type { ProjectRepository } from '../../domain/repositories/project.repository';
import type { DashboardOutput } from '../dto/project.dto';
import { toProjectOutput } from './project-output.helper';

@Injectable()
export class GetDashboardUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY) private readonly repo: ProjectRepository,
  ) {}

  async execute(tenantId: string): Promise<DashboardOutput> {
    const [statusCounts, allProjects] = await Promise.all([
      this.repo.countByStatus(tenantId),
      this.repo.findAllByTenant(tenantId),
    ]);

    const recentProjects = allProjects
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 10)
      .map(toProjectOutput);

    return { statusCounts, recentProjects };
  }
}
