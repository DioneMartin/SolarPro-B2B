import type { RawProposal } from '../../../shared/types/calculation.types';
import type { Criterion } from './criterion';

export class CriteriaMeetsTarget implements Criterion {
  matches(p: RawProposal): boolean {
    return p.energy.targetMet;
  }
}
