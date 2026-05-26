export class UnknownStrategyError extends Error {
  constructor(kind: string) {
    super(`Unknown alert strategy kind: "${kind}". Register the strategy in AlertsModule.`);
    this.name = 'UnknownStrategyError';
  }
}
