import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../shared/errors';
import { PROPOSAL_REPOSITORY } from '../../domain/repositories/proposal.repository';
import type { ProposalRepository } from '../../domain/repositories/proposal.repository';
import { PROJECT_REPOSITORY } from '../../../project-client/domain/repositories/project.repository';
import type { ProjectRepository } from '../../../project-client/domain/repositories/project.repository';
import { ProjectStatus } from '../../../project-client/domain/value-objects/project-status.enum';
import { EVENT_BUS } from '../../../shared/event-bus/event-bus.port';
import type { EventBus } from '../../../shared/event-bus/event-bus.port';
import { toProposalOutput } from './proposal-output.helper';

@Injectable()
export class RejectProposalUseCase {
  constructor(
    @Inject(PROPOSAL_REPOSITORY) private readonly proposalRepo: ProposalRepository,
    @Inject(PROJECT_REPOSITORY) private readonly projectRepo: ProjectRepository,
    @Inject(EVENT_BUS) private readonly eventBus: EventBus,
  ) {}

  async execute(proposalId: string, tenantId: string) {
    const proposal = await this.proposalRepo.findById(proposalId, tenantId);
    if (!proposal) throw new NotFoundError('Proposal', proposalId);

    proposal.reject();
    await this.proposalRepo.save(proposal);

    await this.eventBus.publish('proposal.rejected', {
      proposalId: proposal.id,
      tenantId,
      projectId: proposal.projectId,
    });

    // If every proposal for this project is now rejected → reject the project too
    const counts = await this.proposalRepo.countByProjectId(proposal.projectId, tenantId);
    if (counts.total > 0 && counts.rejected === counts.total) {
      const project = await this.projectRepo.findById(proposal.projectId, tenantId);
      if (project && project.status !== ProjectStatus.REJECTED) {
        try {
          project.reject();
          await this.projectRepo.save(project);

          await this.eventBus.publish('project.rejected', {
            projectId: proposal.projectId,
            tenantId,
          });
        } catch {
          // Transition not legal from current status (e.g. already APPROVED) — skip silently
        }
      }
    }

    return toProposalOutput(proposal);
  }
}
