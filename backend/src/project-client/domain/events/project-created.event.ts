export class ProjectCreatedEvent {
  constructor(
    readonly projectId: string,
    readonly tenantId: string,
    readonly clientId: string,
  ) {}
}
