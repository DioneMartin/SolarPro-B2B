import type { RawProposal } from '../../../shared/types/calculation.types';
import type { Criterion } from './criterion';

/** Ranks proposals by payback year ascending (shortest payback first). No payback = Infinity. */
export class CriteriaShortestPayback implements Criterion {
  matches(_p: RawProposal): boolean {
    return true;
  }

  compare(a: RawProposal, b: RawProposal): number {
    const pa = a.finance.paybackYear ?? Infinity;
    const pb = b.finance.paybackYear ?? Infinity;
    return pa - pb;
  }
}
