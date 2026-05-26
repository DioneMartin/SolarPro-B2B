import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PROPOSAL_REPOSITORY } from '../../domain/repositories/proposal.repository';
import type { ProposalRepository } from '../../domain/repositories/proposal.repository';
import type { Proposal } from '../../domain/entities/proposal.entity';

@Injectable()
export class GetProposalUseCase {
  constructor(
    @Inject(PROPOSAL_REPOSITORY)
    private readonly repo: ProposalRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<Proposal> {
    const proposal = await this.repo.findById(id, tenantId);
    if (!proposal) throw new NotFoundException(`Proposal ${id} not found.`);
    return proposal;
  }
}
