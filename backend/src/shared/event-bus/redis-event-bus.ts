import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  DomainEventEnvelope,
  EventBus,
  EventHandler,
} from './event-bus.port';

const CHANNEL_PREFIX = 'solarpro:events:';

@Injectable()
export class RedisEventBus implements EventBus, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisEventBus.name);
  private publisher!: Redis;
  private subscriber!: Redis;
  private readonly handlers = new Map<string, EventHandler[]>();

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  onModuleInit(): void {
    const redisOptions = {
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: Number(this.config.get<string>('REDIS_PORT', '6379')),
      lazyConnect: false,
      maxRetriesPerRequest: 3,
    };
    this.publisher = new Redis(redisOptions);
    this.subscriber = new Redis(redisOptions);

    this.subscriber.on('pmessage', (_pattern, channel, message) => {
      const name = channel.slice(CHANNEL_PREFIX.length);
      const handlers = this.handlers.get(name);
      if (!handlers || handlers.length === 0) return;

      let envelope: DomainEventEnvelope;
      try {
        envelope = JSON.parse(message) as DomainEventEnvelope;
      } catch (err) {
        this.logger.error(`Bad event payload on ${channel}: ${String(err)}`);
        return;
      }

      for (const handler of handlers) {
        Promise.resolve()
          .then(() => handler(envelope))
          .catch((err) =>
            this.logger.error(
              `Handler for ${name} failed: ${err instanceof Error ? err.message : String(err)}`,
              err instanceof Error ? err.stack : undefined,
            ),
          );
      }
    });

    void this.subscriber.psubscribe(`${CHANNEL_PREFIX}*`);
    this.logger.log('Redis event bus initialized');
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled([
      this.publisher?.quit(),
      this.subscriber?.quit(),
    ]);
  }

  async publish<T>(name: string, payload: T): Promise<void> {
    const envelope: DomainEventEnvelope<T> = {
      name,
      payload,
      occurredAt: new Date().toISOString(),
    };
    await this.publisher.publish(
      `${CHANNEL_PREFIX}${name}`,
      JSON.stringify(envelope),
    );
  }

  subscribe<T>(name: string, handler: EventHandler<T>): void {
    const existing = this.handlers.get(name) ?? [];
    existing.push(handler as EventHandler);
    this.handlers.set(name, existing);
  }
}
