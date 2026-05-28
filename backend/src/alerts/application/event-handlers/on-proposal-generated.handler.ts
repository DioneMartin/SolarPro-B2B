import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AlertPolicy } from '../../domain/entities/alert-policy.entity';
import { ALERT_POLICY_REPOSITORY } from '../../domain/repositories/alert-policy.repository';
import type { AlertPolicyRepository } from '../../domain/repositories/alert-policy.repository';
import { EVENT_BUS } from '../../../shared/event-bus/event-bus.port';
import type { EventBus } from '../../../shared/event-bus/event-bus.port';

/**
 * Subscribes to `proposal.generated` and auto-creates a TIME_BASED policy
 * that fires every minute. This is intentionally short for demonstration
 * purposes — swap the cron to a real quarterly/annual schedule in production.
 */
@Injectable()
export class OnProposalGeneratedHandler implements OnModuleInit {
  private readonly logger = new Logger(OnProposalGeneratedHandler.name);

  constructor(
    @Inject(ALERT_POLICY_REPOSITORY)
    private readonly policyRepo: AlertPolicyRepository,
    @Inject(EVENT_BUS)
    private readonly eventBus: EventBus,
  ) {}

  async onModuleInit(): Promise<void> {
    this.eventBus.subscribe('proposal.generated', async (envelope) => {
      try {
        await this.handle(
          (envelope?.payload ?? {}) as { projectId: string; tenantId: string },
        );
      } catch (err: any) {
        this.logger.error(`Error handling proposal.generated: ${err.message}`);
      }
    });
  }

  private async handle(payload: { projectId: string; tenantId: string }): Promise<void> {
    // Avoid creating duplicate test policies for the same project
    const existing = await this.policyRepo.findByProjectId(payload.projectId, payload.tenantId);
    const alreadyHasTestPolicy = existing.some(
      (p) =>
        p.strategyKind === 'TIME_BASED' &&
        (p.config as any).schedule?.some((s: any) => s.cron === '* * * * *'),
    );
    if (alreadyHasTestPolicy) return;

    const policy = AlertPolicy.create({
      id: uuidv4(),
      tenantId: payload.tenantId,
      projectId: payload.projectId,
      strategyKind: 'TIME_BASED',
      config: {
        schedule: [
          {
            kind: 'PANEL_CLEANING',
            cron: '* * * * *', // every minute — for demo/testing purposes
            leadDays: 0,
          },
        ],
      },
    });

    await this.policyRepo.save(policy);
    this.logger.log(
      `Per-minute test alert policy created for project ${payload.projectId}`,
    );
  }
}
