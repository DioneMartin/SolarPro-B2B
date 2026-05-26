import { Global, Module } from '@nestjs/common';
import { EVENT_BUS } from './event-bus.port';
import { RedisEventBus } from './redis-event-bus';

@Global()
@Module({
  providers: [
    RedisEventBus,
    { provide: EVENT_BUS, useExisting: RedisEventBus },
  ],
  exports: [EVENT_BUS],
})
export class EventBusModule {}
