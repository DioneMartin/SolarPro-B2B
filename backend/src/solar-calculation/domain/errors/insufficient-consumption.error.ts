export class InsufficientConsumptionError extends Error {
  constructor(monthCount: number) {
    super(`At least 3 months of consumption data are required; got ${monthCount}.`);
    this.name = 'InsufficientConsumptionError';
  }
}
