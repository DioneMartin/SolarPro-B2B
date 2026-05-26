import type { RawProposal } from '../../../shared/types/calculation.types';

export interface Criterion {
  /** Returns true if the proposal passes this criterion. */
  matches(p: RawProposal): boolean;
  /** Optional comparator for ranking. Lower return value = ranked first. */
  compare?(a: RawProposal, b: RawProposal): number;
}
