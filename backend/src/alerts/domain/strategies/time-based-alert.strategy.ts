import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AlertEvent } from '../entities/alert-event.entity';
import type { AlertPolicy, TimeBasedConfig, ScheduleItem } from '../entities/alert-policy.entity';
import type { AlertStrategy, EvaluationContext } from './alert-strategy';
import { ALERT_EVENT_REPOSITORY } from '../repositories/alert-event.repository';
import type { AlertEventRepository } from '../repositories/alert-event.repository';

/**
 * Emits a maintenance alert when we are within `leadDays` of the next cron
 * fire time. Idempotent: checks the DB before emitting to avoid re-firing
 * every 15 minutes for the same period.
 *
 * Cron parsing is done manually for the two standard patterns used in v1:
 *   - quarterly: first day of Jan/Apr/Jul/Oct  (months 0/3/6/9, day 1)
 *   - annual:    1 January                     (month 0, day 1)
 * For arbitrary crons, we fall back to a 90-day window check.
 */
@Injectable()
export class TimeBasedAlertStrategy implements AlertStrategy {
  readonly kind = 'TIME_BASED' as const;

  constructor(
    @Inject(ALERT_EVENT_REPOSITORY)
    private readonly eventRepo: AlertEventRepository,
  ) {}

  async evaluate(policy: AlertPolicy, ctx: EvaluationContext): Promise<AlertEvent[]> {
    const config = policy.config as TimeBasedConfig;
    const results: AlertEvent[] = [];

    for (const item of config.schedule) {
      const title = this.titleFor(item);
      const nextDue = this.nextDueDate(item, ctx.now);
      const windowStart = new Date(nextDue.getTime() - item.leadDays * 86_400_000);

      // Are we within the lead-day window?
      if (ctx.now < windowStart) continue;

      // Idempotency: was this alert already emitted since the window opened?
      const alreadyFired = await this.eventRepo.existsSince(policy.id, title, windowStart);
      if (alreadyFired) continue;

      results.push(
        AlertEvent.create({
          id: uuidv4(),
          tenantId: policy.tenantId,
          policyId: policy.id,
          projectId: policy.projectId,
          severity: 'INFO',
          title,
          body: `Scheduled maintenance due ${nextDue.toDateString()} (in ${item.leadDays} days). Type: ${item.kind}.`,
          payload: { scheduleKind: item.kind, dueDate: nextDue.toISOString() },
          triggeredAt: ctx.now,
        }),
      );
    }

    return results;
  }

  private titleFor(item: ScheduleItem): string {
    return item.kind === 'PANEL_CLEANING' ? 'Panel cleaning due' : 'Inverter maintenance due';
  }

  /**
   * Approximates the next fire time for the two standard cron patterns.
   * For any unrecognised pattern, returns a date 90 days from now so the
   * window check passes and a real cron parser can be added later.
   */
  private nextDueDate(item: ScheduleItem, now: Date): Date {
    const y = now.getFullYear();
    const m = now.getMonth(); // 0-based

    if (item.cron === '0 9 1 */3 *') {
      // Quarterly: 1st of Jan, Apr, Jul, Oct
      const quarters = [0, 3, 6, 9];
      for (const q of quarters) {
        const d = new Date(y, q, 1, 9, 0, 0);
        if (d > now) return d;
      }
      return new Date(y + 1, 0, 1, 9, 0, 0);
    }

    if (item.cron === '0 9 1 1 *') {
      // Annual: 1st Jan
      const d = new Date(y, 0, 1, 9, 0, 0);
      return d > now ? d : new Date(y + 1, 0, 1, 9, 0, 0);
    }

    // Fallback — treat any unrecognised cron as 90-day from now
    void m; // suppress unused variable warning
    return new Date(now.getTime() + 90 * 86_400_000);
  }
}
