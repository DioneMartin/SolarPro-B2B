import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Public } from './shared/auth';
import { RedisHealth } from './shared/event-bus';

@Controller()
export class AppController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly redisHealth: RedisHealth,
  ) {}

  @Public()
  @Get('health')
  async health() {
    const [db, redis] = await Promise.all([
      this.checkDb(),
      this.redisHealth.ping(),
    ]);
    const ok = db && redis;
    return {
      status: ok ? 'ok' : 'degraded',
      checks: { database: db, redis },
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDb(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
