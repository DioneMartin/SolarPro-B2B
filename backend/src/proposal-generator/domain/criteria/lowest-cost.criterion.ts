import type { RawProposal } from '../../../shared/types/calculation.types';
import type { Criterion } from './criterion';

/** Ranks proposals by total capex ascending (cheapest first). */
export class CriteriaLowestCost implements Criterion {
  matches(_p: RawProposal): boolean {
    return true;
  }

  compare(a: RawProposal, b: RawProposal): number {
    return a.finance.capexTotal.amount - b.finance.capexTotal.amount;
  }
}
