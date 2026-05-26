import type { RawProposal } from '../../../shared/types/calculation.types';
import type { Criterion } from './criterion';

/** Ranks proposals by 20-year ROI ascending (lowest ROI first). */
export class CriteriaLowestROI implements Criterion {
  matches(_p: RawProposal): boolean {
    return true;
  }

  compare(a: RawProposal, b: RawProposal): number {
    return a.finance.roi20YearPct - b.finance.roi20YearPct;
  }
}
