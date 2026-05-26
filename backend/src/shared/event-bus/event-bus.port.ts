export interface DomainEventEnvelope<T = unknown> {
  name: string;
  payload: T;
  occurredAt: string;
}

export type EventHandler<T = unknown> = (
  envelope: DomainEventEnvelope<T>,
) => void | Promise<void>;

export const EVENT_BUS = Symbol('EVENT_BUS');

export interface EventBus {
  publish<T>(name: string, payload: T): Promise<void>;
  subscribe<T>(name: string, handler: EventHandler<T>): void;
}
