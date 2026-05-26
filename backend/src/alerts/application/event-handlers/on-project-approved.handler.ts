import { Injectable, Inject, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AlertPolicy } from '../../domain/entities/alert-policy.entity';
import { ALERT_POLICY_REPOSITORY } from '../../domain/repositories/alert-policy.repository';
import type { AlertPolicyRepository } from '../../domain/repositories/alert-policy.repository';
import { EVENT_BUS } from '../../../shared/event-bus/event-bus.port';
import type { EventBus } from '../../../shared/event-bus/event-bus.port';

/**
 * Subscribes to `project.approved` events and auto-creates a default
 * TIME_BASED AlertPolicy with quarterly cleaning + annual inverter check.
 */
@Injectable()
export class OnProjectApprovedHandler {
  private readonly logger = new Logger(OnProjectApprovedHandler.name);

  constructor(
    @Inject(ALERT_POLICY_REPOSITORY)
    private readonly policyRepo: AlertPolicyRepository,
    @Inject(EVENT_BUS)
    private readonly eventBus: EventBus,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.eventBus.subscribe('project.approved', async (payload: any) => {
      try {
        await this.handle(payload);
      } catch (err: any) {
        this.logger.error(`Error handling project.approved: ${err.message}`);
      }
    });
  }

  private async handle(payload: { projectId: string; tenantId: string }): Promise<void> {
    const policy = AlertPolicy.create({
      id: uuidv4(),
      tenantId: payload.tenantId,
      projectId: payload.projectId,
      strategyKind: 'TIME_BASED',
      config: {
        schedule: [
          { kind: 'PANEL_CLEANING', cron: '0 9 1 */3 *', leadDays: 7 },
          { kind: 'INVERTER_CHECK', cron: '0 9 1 1 *', leadDays: 14 },
        ],
      },
    });

    await this.policyRepo.save(policy);
    this.logger.log(`Default TIME_BASED policy created for project ${payload.projectId}`);
  }
}
