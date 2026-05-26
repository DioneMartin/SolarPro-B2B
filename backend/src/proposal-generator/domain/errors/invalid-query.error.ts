export class InvalidQueryError extends Error {
  constructor(reason: string) {
    super(`Invalid proposal query: ${reason}`);
    this.name = 'InvalidQueryError';
  }
}
