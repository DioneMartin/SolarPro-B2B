import type { RawProposal } from '../../../shared/types/calculation.types';
import type { Criterion } from './criterion';

export interface PipelineResult {
  filtered: RawProposal[];
  optimal: RawProposal | null;
}

export class CriteriaPipeline {
  constructor(private readonly criteria: Criterion[]) {}

  apply(candidates: RawProposal[]): PipelineResult {
    const filtered = candidates.filter(p => this.criteria.every(c => c.matches(p)));

    // Use the first criterion that defines a comparator for ranking
    const ranker = this.criteria.find(c => typeof c.compare === 'function');
    if (ranker) {
      filtered.sort(ranker.compare!.bind(ranker));
    }

    return { filtered, optimal: filtered[0] ?? null };
  }
}
