import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EVENT_BUS } from '../../../shared/event-bus/event-bus.port';
import type { EventBus } from '../../../shared/event-bus/event-bus.port';
import { NotFoundError } from '../../../shared/errors';
import { Project } from '../../domain/entities/project.entity';
import { ProjectCreatedEvent } from '../../domain/events/project-created.event';
import { CLIENT_REPOSITORY } from '../../domain/repositories/client.repository';
import type { ClientRepository } from '../../domain/repositories/client.repository';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository';
import type { ProjectRepository } from '../../domain/repositories/project.repository';
import type { CreateProjectInput, ProjectOutput } from '../dto/project.dto';
import { toProjectOutput } from './project-output.helper';

@Injectable()
export class CreateProjectUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY) private readonly clientRepo: ClientRepository,
    @Inject(PROJECT_REPOSITORY) private readonly projectRepo: ProjectRepository,
    @Inject(EVENT_BUS) private readonly eventBus: EventBus,
  ) {}

  async execute(input: CreateProjectInput): Promise<ProjectOutput> {
    const client = await this.clientRepo.findById(input.clientId, input.tenantId);
    if (!client) throw new NotFoundError('Client', input.clientId);

    const project = Project.create({ id: uuidv4(), ...input });
    await this.projectRepo.save(project);

    await this.eventBus.publish('project.created', new ProjectCreatedEvent(project.id, project.tenantId, project.clientId));

    return toProjectOutput(project);
  }
}
