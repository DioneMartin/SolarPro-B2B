import type { RawProposal } from '../../../shared/types/calculation.types';
import type { Criterion } from './criterion';

/** Ranks proposals by 20-year ROI descending (highest ROI first). */
export class CriteriaHighestROI implements Criterion {
  matches(_p: RawProposal): boolean {
    return true;
  }

  compare(a: RawProposal, b: RawProposal): number {
    return b.finance.roi20YearPct - a.finance.roi20YearPct;
  }
}
