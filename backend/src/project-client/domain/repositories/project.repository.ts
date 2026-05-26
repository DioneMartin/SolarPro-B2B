import { Project } from '../entities/project.entity';
import { ProjectStatus } from '../value-objects/project-status.enum';

export interface ProjectRepository {
  findById(id: string, tenantId: string): Promise<Project | null>;
  findAllByTenant(tenantId: string, filters?: { clientId?: string; status?: ProjectStatus }): Promise<Project[]>;
  countByStatus(tenantId: string): Promise<Record<string, number>>;
  save(project: Project): Promise<void>;
}

export const PROJECT_REPOSITORY = 'PROJECT_REPOSITORY';
