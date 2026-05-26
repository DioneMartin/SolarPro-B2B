import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AlertEvaluator } from '../../application/services/alert-evaluator';

@Injectable()
export class AlertCron {
  private readonly logger = new Logger(AlertCron.name);

  constructor(private readonly evaluator: AlertEvaluator) {}

  @Cron('0 */15 * * * *') // every 15 minutes
  async tick(): Promise<void> {
    this.logger.debug('Alert evaluator tick');
    await this.evaluator.tick();
  }
}
