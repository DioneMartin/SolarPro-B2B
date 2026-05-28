export enum ProjectStatus {
  DRAFT = 'DRAFT',
  READY_FOR_PROPOSAL = 'READY_FOR_PROPOSAL',
  PROPOSED = 'PROPOSED',
  APPROVED = 'APPROVED',
  INSTALLED = 'INSTALLED',
  REJECTED = 'REJECTED',
}

/** Legal forward transitions in the state machine */
export const ALLOWED_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  [ProjectStatus.DRAFT]: [ProjectStatus.READY_FOR_PROPOSAL],
  [ProjectStatus.READY_FOR_PROPOSAL]: [ProjectStatus.PROPOSED],
  [ProjectStatus.PROPOSED]: [ProjectStatus.APPROVED, ProjectStatus.REJECTED],
  [ProjectStatus.APPROVED]: [ProjectStatus.INSTALLED],
  [ProjectStatus.INSTALLED]: [],
  [ProjectStatus.REJECTED]: [],
};
