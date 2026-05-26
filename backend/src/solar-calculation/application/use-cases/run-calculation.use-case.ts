import { Injectable, Inject } from '@nestjs/common';
import type { CalculationInput, CalculationOutput } from '../../../shared/types/calculation.types';
import { EVENT_BUS } from '../../../shared/event-bus/event-bus.port';
import type { EventBus } from '../../../shared/event-bus/event-bus.port';
import { SolarCalculationEngine } from '../../domain/services/solar-calculation.engine';

@Injectable()
export class RunCalculationUseCase {
  constructor(
    private readonly engine: SolarCalculationEngine,
    @Inject(EVENT_BUS)
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: CalculationInput): Promise<CalculationOutput> {
    const output = this.engine.calculate(input);

    await this.eventBus.publish('calculation.completed', {
      projectId: input.projectId,
      tenantId: input.tenantId,
      candidateCount: output.length,
    });

    return output;
  }
}
