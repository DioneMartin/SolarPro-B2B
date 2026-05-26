import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PROPOSAL_REPOSITORY } from '../../domain/repositories/proposal.repository';
import type { ProposalRepository } from '../../domain/repositories/proposal.repository';

@Injectable()
export class DeleteProposalUseCase {
  constructor(
    @Inject(PROPOSAL_REPOSITORY)
    private readonly repo: ProposalRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const proposal = await this.repo.findById(id, tenantId);
    if (!proposal) throw new NotFoundException(`Proposal ${id} not found.`);
    if (!proposal.isDraft()) {
      throw new BadRequestException('Only DRAFT proposals can be deleted.');
    }
    await this.repo.delete(id, tenantId);
  }
}
