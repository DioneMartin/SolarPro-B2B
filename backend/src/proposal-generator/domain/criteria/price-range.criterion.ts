import type { RawProposal } from '../../../shared/types/calculation.types';
import type { Criterion } from './criterion';

export class CriteriaPriceRange implements Criterion {
  constructor(
    private readonly min: number,
    private readonly max: number,
  ) {}

  matches(p: RawProposal): boolean {
    const capex = p.finance.capexTotal.amount;
    return capex >= this.min && capex <= this.max;
  }
}
