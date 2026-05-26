import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Lightweight singleton Redis ping client for the /health endpoint.
 * Separate from the pub/sub clients so we don't disturb subscriptions.
 */
@Injectable()
export class RedisHealth {
  private client?: Redis;

  constructor(private readonly config: ConfigService) {}

  private getClient(): Redis {
    if (!this.client) {
      this.client = new Redis({
        host: this.config.get<string>('REDIS_HOST', 'localhost'),
        port: Number(this.config.get<string>('REDIS_PORT', '6379')),
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      });
    }
    return this.client;
  }

  async ping(): Promise<boolean> {
    try {
      const client = this.getClient();
      if (client.status === 'wait' || client.status === 'end') {
        await client.connect();
      }
      const reply = await client.ping();
      return reply === 'PONG';
    } catch {
      return false;
    }
  }
}
