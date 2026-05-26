import type { RawProposal } from '../../../shared/types/calculation.types';
import type { Criterion } from './criterion';

export class CriteriaBrand implements Criterion {
  constructor(private readonly brand: string) {}

  matches(p: RawProposal): boolean {
    return p.panel.brand.toLowerCase() === this.brand.toLowerCase();
  }
}
