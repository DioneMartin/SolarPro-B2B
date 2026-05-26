export class NoViableCombinationError extends Error {
  constructor(reason: string) {
    super(`No viable panel+inverter combination found: ${reason}`);
    this.name = 'NoViableCombinationError';
  }
}
