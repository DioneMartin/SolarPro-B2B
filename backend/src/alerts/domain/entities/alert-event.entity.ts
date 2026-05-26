export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

interface CreateAlertEventProps {
  id: string;
  tenantId: string;
  policyId: string;
  projectId: string;
  severity: AlertSeverity;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  triggeredAt: Date;
}

interface RehydrateAlertEventProps extends CreateAlertEventProps {
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export class AlertEvent {
  private constructor(
    readonly id: string,
    readonly tenantId: string,
    readonly policyId: string,
    readonly projectId: string,
    readonly severity: AlertSeverity,
    readonly title: string,
    readonly body: string,
    readonly payload: Record<string, unknown>,
    readonly triggeredAt: Date,
    private _acknowledgedAt: Date | undefined,
    private _acknowledgedBy: string | undefined,
  ) {}

  static create(props: CreateAlertEventProps): AlertEvent {
    return new AlertEvent(
      props.id,
      props.tenantId,
      props.policyId,
      props.projectId,
      props.severity,
      props.title,
      props.body,
      props.payload,
      props.triggeredAt,
      undefined,
      undefined,
    );
  }

  static rehydrate(props: RehydrateAlertEventProps): AlertEvent {
    return new AlertEvent(
      props.id,
      props.tenantId,
      props.policyId,
      props.projectId,
      props.severity,
      props.title,
      props.body,
      props.payload,
      props.triggeredAt,
      props.acknowledgedAt,
      props.acknowledgedBy,
    );
  }

  get acknowledgedAt(): Date | undefined {
    return this._acknowledgedAt;
  }

  get acknowledgedBy(): string | undefined {
    return this._acknowledgedBy;
  }

  get isAcknowledged(): boolean {
    return this._acknowledgedAt !== undefined;
  }

  acknowledge(userId: string): void {
    if (this.isAcknowledged) return;
    this._acknowledgedAt = new Date();
    this._acknowledgedBy = userId;
  }
}
