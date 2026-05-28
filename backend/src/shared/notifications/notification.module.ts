import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventBusModule } from '../event-bus/event-bus.module';
import { NotificationGateway } from './notification.gateway';
import { ActivityNotificationListener } from './activity-notification.listener';

@Module({
  imports: [
    EventBusModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  providers: [
    NotificationGateway,
    ActivityNotificationListener,
  ],
})
export class NotificationModule {}
