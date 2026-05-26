import type { Criterion } from '../criteria/criterion';

export interface ProposalQueryParams {
  energyDemandTargetPct: number;
  horizonYears: number;
  energyInflationPctPerYear: number;
  systemLossFactor: number;
  discountRatePct?: number;
}

export interface ProposalQuery {
  readonly projectId: string;
  readonly params: Readonly<ProposalQueryParams>;
  readonly brandWhitelist?: readonly string[];
  readonly criteria: readonly Criterion[];
}
