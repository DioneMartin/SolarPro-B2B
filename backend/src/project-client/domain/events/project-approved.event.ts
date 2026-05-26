export class ProjectApprovedEvent {
  constructor(
    readonly projectId: string,
    readonly tenantId: string,
    readonly selectedProposalId: string,
    readonly approvedAt: Date,
  ) {}
}
