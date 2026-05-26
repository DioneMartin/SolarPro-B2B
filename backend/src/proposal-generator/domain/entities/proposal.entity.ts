import type { RawProposal } from '../../../shared/types/calculation.types';
import type { ProposalQuery } from '../value-objects/proposal-query.vo';

export enum ProposalStatus {
  DRAFT = 'DRAFT',
  EXPORTED = 'EXPORTED',
}

interface CreateProposalProps {
  id: string;
  tenantId: string;
  projectId: string;
  query: ProposalQuery;
  rawCandidates: RawProposal[];
  optimal: RawProposal | null;
  createdBy: string;
}

interface RehydrateProposalProps extends CreateProposalProps {
  status: ProposalStatus;
  exportedPdfRef?: string;
  createdAt: Date;
}

export class Proposal {
  private constructor(
    readonly id: string,
    readonly tenantId: string,
    readonly projectId: string,
    readonly query: ProposalQuery,
    readonly rawCandidates: RawProposal[],
    readonly optimal: RawProposal | null,
    private _status: ProposalStatus,
    private _exportedPdfRef: string | undefined,
    readonly createdBy: string,
    readonly createdAt: Date,
  ) {}

  static create(props: CreateProposalProps): Proposal {
    return new Proposal(
      props.id,
      props.tenantId,
      props.projectId,
      props.query,
      props.rawCandidates,
      props.optimal,
      ProposalStatus.DRAFT,
      undefined,
      props.createdBy,
      new Date(),
    );
  }

  static rehydrate(props: RehydrateProposalProps): Proposal {
    return new Proposal(
      props.id,
      props.tenantId,
      props.projectId,
      props.query,
      props.rawCandidates,
      props.optimal,
      props.status,
      props.exportedPdfRef,
      props.createdBy,
      props.createdAt,
    );
  }

  get status(): ProposalStatus {
    return this._status;
  }

  get exportedPdfRef(): string | undefined {
    return this._exportedPdfRef;
  }

  markExported(pdfRef: string): void {
    this._exportedPdfRef = pdfRef;
    this._status = ProposalStatus.EXPORTED;
  }

  isDraft(): boolean {
    return this._status === ProposalStatus.DRAFT;
  }
}
