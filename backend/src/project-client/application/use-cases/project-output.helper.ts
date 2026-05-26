import { Project } from '../../domain/entities/project.entity';
import type { ProjectOutput } from '../dto/project.dto';

export function toProjectOutput(p: Project): ProjectOutput {
  return {
    id: p.id, tenantId: p.tenantId, clientId: p.clientId,
    name: p.name, siteAddress: p.siteAddress.toPlain(),
    status: p.status, energyDemandTargetPct: p.energyDemandTargetPct,
    consumptionRefId: p.consumptionRefId, surfaceRefId: p.surfaceRefId,
    selectedProposalId: p.selectedProposalId,
    createdAt: p.createdAt, updatedAt: p.updatedAt,
  };
}
