import { Injectable, Inject, Logger } from '@nestjs/common';
import { EVENT_BUS } from '../../../shared/event-bus/event-bus.port';
import type { EventBus } from '../../../shared/event-bus/event-bus.port';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository';
import type { ProjectRepository } from '../../domain/repositories/project.repository';
import { Project } from '../../domain/entities/project.entity';
import { ProjectStatus } from '../../domain/value-objects/project-status.enum';

/**
 * Bridges the data-ingestion module to the project lifecycle.
 *
 * Ingestion publishes `consumption.updated` / `surface.updated` after a bill is
 * extracted or a surface lookup completes. This handler attaches the resulting
 * record ref to the project and, once BOTH consumption and surface are present,
 * advances the project DRAFT -> READY_FOR_PROPOSAL so proposals can be generated.
 */
@Injectable()
export class OnIngestionCompletedHandler {
  private readonly logger = new Logger(OnIngestionCompletedHandler.name);

  constructor(
    @Inject(PROJECT_REPOSITORY) private readonly repo: ProjectRepository,
    @Inject(EVENT_BUS) private readonly eventBus: EventBus,
  ) {}

  async onModuleInit(): Promise<void> {
    this.eventBus.subscribe('consumption.updated', async (envelope) => {
      const payload = (envelope?.payload ?? {}) as any;
      await this.safeHandle('consumption.updated', payload, (project) =>
        project.attachConsumption(payload.recordId),
      );
    });

    this.eventBus.subscribe('surface.updated', async (envelope) => {
      const payload = (envelope?.payload ?? {}) as any;
      await this.safeHandle('surface.updated', payload, (project) =>
        project.attachSurface(payload.recordId),
      );
    });
  }

  private async safeHandle(
    event: string,
    payload: { recordId: string; projectId: string; tenantId: string },
    attach: (project: Project) => void,
  ): Promise<void> {
    try {
      if (!payload?.projectId || !payload?.tenantId || !payload?.recordId) {
        this.logger.warn(`${event} missing fields; skipping`);
        return;
      }

      const project = await this.repo.findById(payload.projectId, payload.tenantId);
      if (!project) {
        this.logger.warn(`${event}: project ${payload.projectId} not found; skipping`);
        return;
      }

      attach(project);

      // Once both inputs are attached and we're still in DRAFT, advance the
      // project so the proposal flow unlocks.
      if (
        project.status === ProjectStatus.DRAFT &&
        project.consumptionRefId &&
        project.surfaceRefId
      ) {
        project.markReadyForProposal();
        this.logger.log(`Project ${project.id} -> READY_FOR_PROPOSAL`);
      }

      await this.repo.save(project);
    } catch (err: any) {
      this.logger.error(`Error handling ${event}: ${err.message}`);
    }
  }
}
