import type { RawProposal } from '../../../shared/types/calculation.types';
import type { Criterion } from './criterion';

export class NotCriterion implements Criterion {
  constructor(private readonly child: Criterion) {}

  matches(p: RawProposal): boolean {
    return !this.child.matches(p);
  }
}
