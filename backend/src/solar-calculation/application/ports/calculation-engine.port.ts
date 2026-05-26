import type { CalculationInput, CalculationOutput } from '../../../shared/types/calculation.types';

export interface CalculationEnginePort {
  calculate(input: CalculationInput): CalculationOutput;
}

export const CALCULATION_ENGINE_PORT = 'CALCULATION_ENGINE_PORT';
