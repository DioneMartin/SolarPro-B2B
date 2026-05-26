import { AddressProps } from '../../domain/value-objects/address.vo';

export interface CreateProjectInput {
  tenantId: string;
  clientId: string;
  name: string;
  siteAddress: AddressProps;
  energyDemandTargetPct: number;
}

export interface ProjectOutput {
  id: string;
  tenantId: string;
  clientId: string;
  name: string;
  siteAddress: AddressProps;
  status: string;
  energyDemandTargetPct: number;
  consumptionRefId?: string;
  surfaceRefId?: string;
  selectedProposalId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardOutput {
  statusCounts: Record<string, number>;
  recentProjects: ProjectOutput[];
}
