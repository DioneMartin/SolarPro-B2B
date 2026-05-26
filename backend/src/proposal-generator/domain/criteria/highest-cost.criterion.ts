import type { RawProposal } from '../../../shared/types/calculation.types';
import type { Criterion } from './criterion';

/** Ranks proposals by total capex descending (most expensive first). */
export class CriteriaHighestCost implements Criterion {
  matches(_p: RawProposal): boolean {
    return true;
  }

  compare(a: RawProposal, b: RawProposal): number {
    return b.finance.capexTotal.amount - a.finance.capexTotal.amount;
  }
}
