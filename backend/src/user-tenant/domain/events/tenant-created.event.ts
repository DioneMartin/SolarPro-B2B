export class TenantCreatedEvent {
  constructor(
    readonly tenantId: string,
    readonly slug: string,
    readonly createdAt: Date,
  ) {}
}
