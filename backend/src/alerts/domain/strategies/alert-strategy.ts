import type { AlertPolicy, StrategyKind } from '../entities/alert-policy.entity';
import type { AlertEvent } from '../entities/alert-event.entity';

export interface EvaluationContext {
  now: Date;
}

export interface AlertStrategy {
  readonly kind: StrategyKind;
  evaluate(policy: AlertPolicy, ctx: EvaluationContext): Promise<AlertEvent[]>;
}
