import { DomainRuleError } from '../../../shared/errors';
import { IllegalProjectTransitionError } from '../errors/illegal-project-transition.error';
import { ProjectNotReadyError } from '../errors/project-not-ready.error';
import { Address, AddressProps } from '../value-objects/address.vo';
import { ALLOWED_TRANSITIONS, ProjectStatus } from '../value-objects/project-status.enum';

interface CreateProjectProps {
  id: string;
  tenantId: string;
  clientId: string;
  name: string;
  siteAddress: AddressProps;
  energyDemandTargetPct: number;
}

interface RehydrateProjectProps extends CreateProjectProps {
  status: ProjectStatus;
  consumptionRefId?: string;
  surfaceRefId?: string;
  selectedProposalId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Project {
  private constructor(
    readonly id: string,
    readonly tenantId: string,
    readonly clientId: string,
    private _name: string,
    private _siteAddress: Address,
    private _status: ProjectStatus,
    private _energyDemandTargetPct: number,
    private _consumptionRefId: string | undefined,
    private _surfaceRefId: string | undefined,
    private _selectedProposalId: string | undefined,
    readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static create(props: CreateProjectProps): Project {
    if (props.energyDemandTargetPct < 1 || props.energyDemandTargetPct > 200) {
      throw new DomainRuleError('energyDemandTargetPct must be between 1 and 200');
    }
    const now = new Date();
    return new Project(
      props.id, props.tenantId, props.clientId,
      props.name.trim(),
      Address.create(props.siteAddress),
      ProjectStatus.DRAFT,
      props.energyDemandTargetPct,
      undefined, undefined, undefined,
      now, now,
    );
  }

  static rehydrate(props: RehydrateProjectProps): Project {
    return new Project(
      props.id, props.tenantId, props.clientId,
      props.name,
      Address.create(props.siteAddress),
      props.status,
      props.energyDemandTargetPct,
      props.consumptionRefId,
      props.surfaceRefId,
      props.selectedProposalId,
      props.createdAt,
      props.updatedAt,
    );
  }

  get name(): string { return this._name; }
  get siteAddress(): Address { return this._siteAddress; }
  get status(): ProjectStatus { return this._status; }
  get energyDemandTargetPct(): number { return this._energyDemandTargetPct; }
  get consumptionRefId(): string | undefined { return this._consumptionRefId; }
  get surfaceRefId(): string | undefined { return this._surfaceRefId; }
  get selectedProposalId(): string | undefined { return this._selectedProposalId; }
  get updatedAt(): Date { return this._updatedAt; }

  attachConsumption(refId: string): void {
    this._consumptionRefId = refId;
    this._updatedAt = new Date();
  }

  attachSurface(refId: string): void {
    this._surfaceRefId = refId;
    this._updatedAt = new Date();
  }

  markReadyForProposal(): void {
    if (!this._consumptionRefId) throw new ProjectNotReadyError('consumptionRefId');
    if (!this._surfaceRefId) throw new ProjectNotReadyError('surfaceRefId');
    this.transitionTo(ProjectStatus.READY_FOR_PROPOSAL);
  }

  selectProposal(proposalId: string): void {
    if (this._status !== ProjectStatus.READY_FOR_PROPOSAL && this._status !== ProjectStatus.PROPOSED) {
      throw new IllegalProjectTransitionError(this._status, ProjectStatus.PROPOSED);
    }
    this._selectedProposalId = proposalId;
    this._status = ProjectStatus.PROPOSED;
    this._updatedAt = new Date();
  }

  approve(): void {
    if (!this._selectedProposalId) throw new ProjectNotReadyError('selectedProposalId');
    this.transitionTo(ProjectStatus.APPROVED);
  }

  markInstalled(): void {
    this.transitionTo(ProjectStatus.INSTALLED);
  }

  private transitionTo(next: ProjectStatus): void {
    const allowed = ALLOWED_TRANSITIONS[this._status];
    if (!allowed.includes(next)) {
      throw new IllegalProjectTransitionError(this._status, next);
    }
    this._status = next;
    this._updatedAt = new Date();
  }
}
