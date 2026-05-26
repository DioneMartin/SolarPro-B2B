import { Module } from '@nestjs/common';
import { EventBusModule } from '../../shared/event-bus/event-bus.module';
import { CLOCK_PORT } from '../application/ports/clock.port';
import { CALCULATION_ENGINE_PORT } from '../application/ports/calculation-engine.port';
import { RunCalculationUseCase } from '../application/use-cases/run-calculation.use-case';
import { SolarCalculationEngine } from '../domain/services/solar-calculation.engine';
import { SystemClockAdapter } from './adapters/system-clock.adapter';

@Module({
  imports: [EventBusModule],
  providers: [
    SystemClockAdapter,
    { provide: CLOCK_PORT, useExisting: SystemClockAdapter },
    SolarCalculationEngine,
    { provide: CALCULATION_ENGINE_PORT, useExisting: SolarCalculationEngine },
    RunCalculationUseCase,
  ],
  exports: [CALCULATION_ENGINE_PORT, RunCalculationUseCase],
})
export class SolarCalculationModule {}
