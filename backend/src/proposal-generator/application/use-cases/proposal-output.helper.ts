import type { RawProposal } from '../../../shared/types/calculation.types';
import type { Proposal } from '../../domain/entities/proposal.entity';

/** Flattened candidate shape consumed by the frontend proposals table. */
export interface CandidateOutput {
  id: string;
  panel: string;
  inverter: string;
  panelCount: number;
  systemKwp: number;
  coveragePct: number;
  targetMet: boolean;
  fitsSurface: boolean;
  totalCost: number;
  currency: string;
  paybackYears: number | null;
  roiPct: number;
  npv: number | null;
}

export interface ProposalOutput {
  id: string;
  projectId: string;
  status: string;
  createdAt: Date;
  candidateCount: number;
  optimal: CandidateOutput | null;
  candidates: CandidateOutput[];
}

function flattenCandidate(c: RawProposal): CandidateOutput {
  return {
    id: c.id,
    panel: `${c.panel.brand} ${c.panel.modelName}`,
    inverter: `${c.inverter.brand} ${c.inverter.modelName}`,
    panelCount: c.panelCount,
    systemKwp: +((c.panelCount * c.panel.spec.wattagePeakW) / 1000).toFixed(2),
    coveragePct: c.energy.coveragePct,
    targetMet: c.energy.targetMet,
    fitsSurface: c.layout.fitsSurface,
    totalCost: c.finance.capexTotal.amount,
    currency: c.finance.capexTotal.currency,
    paybackYears: c.finance.paybackYear ?? null,
    roiPct: c.finance.roi20YearPct,
    npv: c.finance.npv?.amount ?? null,
  };
}

export function toProposalOutput(p: Proposal): ProposalOutput {
  return {
    id: p.id,
    projectId: p.projectId,
    status: p.status,
    createdAt: p.createdAt,
    candidateCount: p.rawCandidates.length,
    optimal: p.optimal ? flattenCandidate(p.optimal) : null,
    candidates: p.rawCandidates.map(flattenCandidate),
  };
}
