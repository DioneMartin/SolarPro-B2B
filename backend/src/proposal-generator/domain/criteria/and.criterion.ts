import type { RawProposal } from '../../../shared/types/calculation.types';
import type { Criterion } from './criterion';

export class AndCriterion implements Criterion {
  constructor(private readonly children: Criterion[]) {}

  matches(p: RawProposal): boolean {
    return this.children.every(c => c.matches(p));
  }
}
