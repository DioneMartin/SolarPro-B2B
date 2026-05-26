export class NoCandidatesError extends Error {
  constructor() {
    super('No proposal candidates survived the applied criteria. Try relaxing your filters.');
    this.name = 'NoCandidatesError';
  }
}
