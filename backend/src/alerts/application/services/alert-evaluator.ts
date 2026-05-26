import { Injectable, Inject, Logger } from '@nestjs/common';
import { ALERT_POLICY_REPOSITORY } from '../../domain/repositories/alert-policy.repository';
import type { AlertPolicyRepository } from '../../domain/repositories/alert-policy.repository';
import { ALERT_EVENT_REPOSITORY } from '../../domain/repositories/alert-event.repository';
import type { AlertEventRepository } from '../../domain/repositories/alert-event.repository';
import type { AlertStrategy } from '../../domain/strategies/alert-strategy';
import { UnknownStrategyError } from '../../domain/errors/unknown-strategy.error';
import { EVENT_BUS } from '../../../shared/event-bus/event-bus.port';
import type { EventBus } from '../../../shared/event-bus/event-bus.port';
import { NOTIFICATION_PORT } from '../ports/notification.port';
import type { NotificationPort } from '../ports/notification.port';

export const ALERT_STRATEGIES = 'ALERT_STRATEGIES';

@Injectable()
export class AlertEvaluator {
  private readonly logger = new Logger(AlertEvaluator.name);

  constructor(
    @Inject(ALERT_POLICY_REPOSITORY)
    private readonly policyRepo: AlertPolicyRepository,
    @Inject(ALERT_EVENT_REPOSITORY)
    private readonly eventRepo: AlertEventRepository,
    @Inject(ALERT_STRATEGIES)
    private readonly strategies: Map<string, AlertStrategy>,
    @Inject(EVENT_BUS)
    private readonly eventBus: EventBus,
    @Inject(NOTIFICATION_PORT)
    private readonly notification: NotificationPort,
  ) {}

  async tick(): Promise<void> {
    const policies = await this.policyRepo.listEnabled();
    const ctx = { now: new Date() };

    for (const policy of policies) {
      const strategy = this.strategies.get(policy.strategyKind);
      if (!strategy) {
        this.logger.error(`No strategy registered for kind "${policy.strategyKind}" (policy ${policy.id})`);
        throw new UnknownStrategyError(policy.strategyKind);
      }

      try {
        const events = await strategy.evaluate(policy, ctx);
        for (const event of events) {
          await this.eventRepo.save(event);
          await this.eventBus.publish('alert.triggered', {
            eventId: event.id,
            tenantId: event.tenantId,
            projectId: event.projectId,
            severity: event.severity,
            title: event.title,
            body: event.body,
            triggeredAt: event.triggeredAt.toISOString(),
          });
          await this.notification.push(event.tenantId, event);
        }
      } catch (err: any) {
        this.logger.error(`Error evaluating policy ${policy.id}: ${err.message}`);
      }
    }
  }
}
