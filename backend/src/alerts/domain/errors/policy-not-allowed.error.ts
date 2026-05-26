export class PolicyNotAllowedError extends Error {
  constructor(projectId: string) {
    super(`Alert policy cannot be created for project ${projectId}: project must be APPROVED first.`);
    this.name = 'PolicyNotAllowedError';
  }
}
