import type { InverterSpec } from '../../../shared/types/panel-spec';

/**
 * An inverter fits a string if its AC output capacity (with 20 % oversizing tolerance)
 * is at least equal to the total DC capacity of the panel array.
 *
 * Rule: inverter.maxOutputCapacityW × 1.2 >= totalDcW
 */
export function inverterFits(spec: InverterSpec, totalDcW: number): boolean {
  return spec.maxOutputCapacityW * 1.2 >= totalDcW;
}
