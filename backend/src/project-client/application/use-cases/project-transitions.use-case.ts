import { Inject, Injectable } from '@nestjs/common';
import { EVENT_BUS } from '../../../shared/event-bus/event-bus.port';
import type { EventBus } from '../../../shared/event-bus/event-bus.port';
import { NotFoundError } from '../../../shared/errors';
import { ProjectApprovedEvent } from '../../domain/events/project-approved.event';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository';
import type { ProjectRepository } from '../../domain/repositories/project.repository';
import type { ProjectOutput } from '../dto/project.dto';
import { toProjectOutput } from './project-output.helper';

@Injectable()
export class MarkReadyForProposalUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY) private readonly repo: ProjectRepository,
  ) {}

  async execute(projectId: string, tenantId: string): Promise<ProjectOutput> {
    const project = await this.repo.findById(projectId, tenantId);
    if (!project) throw new NotFoundError('Project', projectId);
    project.markReadyForProposal();
    await this.repo.save(project);
    return toProjectOutput(project);
  }
}

@Injectable()
export class SelectProposalUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY) private readonly repo: ProjectRepository,
  ) {}

  async execute(projectId: string, tenantId: string, proposalId: string): Promise<ProjectOutput> {
    const project = await this.repo.findById(projectId, tenantId);
    if (!project) throw new NotFoundError('Project', projectId);
    project.selectProposal(proposalId);
    await this.repo.save(project);
    return toProjectOutput(project);
  }
}

@Injectable()
export class ApproveProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY) private readonly repo: ProjectRepository,
    @Inject(EVENT_BUS) private readonly eventBus: EventBus,
  ) {}

  async execute(projectId: string, tenantId: string): Promise<ProjectOutput> {
    const project = await this.repo.findById(projectId, tenantId);
    if (!project) throw new NotFoundError('Project', projectId);
    project.approve();
    await this.repo.save(project);

    await this.eventBus.publish(
      'project.approved',
      new ProjectApprovedEvent(project.id, project.tenantId, project.selectedProposalId!, new Date()),
    );

    return toProjectOutput(project);
  }
}
