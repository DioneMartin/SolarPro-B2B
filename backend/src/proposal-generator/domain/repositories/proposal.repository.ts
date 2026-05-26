import type { Proposal } from '../entities/proposal.entity';

export interface ProposalRepository {
  save(proposal: Proposal): Promise<void>;
  findById(id: string, tenantId: string): Promise<Proposal | null>;
  findByProjectId(projectId: string, tenantId: string): Promise<Proposal[]>;
  delete(id: string, tenantId: string): Promise<void>;
}

export const PROPOSAL_REPOSITORY = 'PROPOSAL_REPOSITORY';
