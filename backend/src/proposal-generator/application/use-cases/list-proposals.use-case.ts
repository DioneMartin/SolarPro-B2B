import { Injectable, Inject } from '@nestjs/common';
import { PROPOSAL_REPOSITORY } from '../../domain/repositories/proposal.repository';
import type { ProposalRepository } from '../../domain/repositories/proposal.repository';
import type { Proposal } from '../../domain/entities/proposal.entity';

@Injectable()
export class ListProposalsUseCase {
  constructor(
    @Inject(PROPOSAL_REPOSITORY)
    private readonly repo: ProposalRepository,
  ) {}

  async execute(projectId: string, tenantId: string): Promise<Proposal[]> {
    return this.repo.findByProjectId(projectId, tenantId);
  }
}
