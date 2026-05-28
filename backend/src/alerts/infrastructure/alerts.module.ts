import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { EventBusModule } from '../../shared/event-bus/event-bus.module';

// Persistence
import { AlertPolicyOrmEntity } from './persistence/alert-policy.orm-entity';
import { AlertEventOrmEntity } from './persistence/alert-event.orm-entity';
import { TypeOrmAlertPolicyRepository } from './persistence/typeorm-alert-policy.repository';
import { TypeOrmAlertEventRepository } from './persistence/typeorm-alert-event.repository';
import { ALERT_POLICY_REPOSITORY } from '../domain/repositories/alert-policy.repository';
import { ALERT_EVENT_REPOSITORY } from '../domain/repositories/alert-event.repository';

// Domain strategies
import { TimeBasedAlertStrategy } from '../domain/strategies/time-based-alert.strategy';
import { WeatherBasedAlertStrategy } from '../domain/strategies/weather-based-alert.strategy';

// Application
import { AlertEvaluator, ALERT_STRATEGIES } from '../application/services/alert-evaluator';
import { OnProjectApprovedHandler } from '../application/event-handlers/on-project-approved.handler';
import { OnProposalGeneratedHandler } from '../application/event-handlers/on-proposal-generated.handler';
import { OnActivityEventHandler } from '../application/event-handlers/on-activity-event.handler';
import { CreateAlertPolicyUseCase, PROJECT_STATUS_READER_PORT } from '../application/use-cases/create-alert-policy.use-case';
import { UpdateAlertPolicyUseCase } from '../application/use-cases/update-alert-policy.use-case';
import { EnableDisableAlertPolicyUseCase } from '../application/use-cases/enable-disable-alert-policy.use-case';
import { ListPoliciesUseCase } from '../application/use-cases/list-policies.use-case';
import { ListAlertEventsUseCase } from '../application/use-cases/list-alert-events.use-case';
import { AcknowledgeAlertEventUseCase } from '../application/use-cases/acknowledge-alert-event.use-case';

// Ports
import { WEATHER_API_PORT } from '../application/ports/weather-api.port';
import { AIR_QUALITY_API_PORT } from '../application/ports/air-quality-api.port';
import { POLLEN_API_PORT } from '../application/ports/pollen-api.port';
import { NOTIFICATION_PORT } from '../application/ports/notification.port';

// Adapters
import { OpenWeatherAdapter } from './adapters/open-weather.adapter';
import { GoogleAirQualityAdapter } from './adapters/google-air-quality.adapter';
import { GooglePollenAdapter } from './adapters/google-pollen.adapter';
import { WebSocketNotificationAdapter } from './adapters/websocket-notification.adapter';
import { ProjectStatusReaderAdapter } from './adapters/project-status-reader.adapter';

// Infrastructure
import { AlertCron } from './scheduling/alert-cron';
import { AlertsGateway } from './websocket/alerts.gateway';
import { PoliciesController } from './http/policies.controller';
import { EventsController } from './http/events.controller';

// Need ProjectOrmEntity for cross-module status read
import { ProjectOrmEntity } from '../../project-client/infrastructure/persistence/project.orm-entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AlertPolicyOrmEntity, AlertEventOrmEntity, ProjectOrmEntity]),
    HttpModule,
    EventBusModule,
    ScheduleModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [PoliciesController, EventsController],
  providers: [
    // Repositories
    TypeOrmAlertPolicyRepository,
    { provide: ALERT_POLICY_REPOSITORY, useExisting: TypeOrmAlertPolicyRepository },
    TypeOrmAlertEventRepository,
    { provide: ALERT_EVENT_REPOSITORY, useExisting: TypeOrmAlertEventRepository },

    // External API adapters
    OpenWeatherAdapter,
    { provide: WEATHER_API_PORT, useExisting: OpenWeatherAdapter },
    GoogleAirQualityAdapter,
    { provide: AIR_QUALITY_API_PORT, useExisting: GoogleAirQualityAdapter },
    GooglePollenAdapter,
    { provide: POLLEN_API_PORT, useExisting: GooglePollenAdapter },

    // Strategies
    TimeBasedAlertStrategy,
    WeatherBasedAlertStrategy,
    {
      provide: ALERT_STRATEGIES,
      useFactory: (timeBased: TimeBasedAlertStrategy, weatherBased: WeatherBasedAlertStrategy) => {
        const map = new Map();
        map.set(timeBased.kind, timeBased);
        map.set(weatherBased.kind, weatherBased);
        return map;
      },
      inject: [TimeBasedAlertStrategy, WeatherBasedAlertStrategy],
    },

    // Evaluator & cron
    AlertEvaluator,
    AlertCron,

    // Event handlers
    OnProjectApprovedHandler,
    OnProposalGeneratedHandler,
    OnActivityEventHandler,

    // WebSocket gateway + notification
    AlertsGateway,
    WebSocketNotificationAdapter,
    { provide: NOTIFICATION_PORT, useExisting: WebSocketNotificationAdapter },

    // Cross-module project status reader
    ProjectStatusReaderAdapter,
    { provide: PROJECT_STATUS_READER_PORT, useExisting: ProjectStatusReaderAdapter },

    // Use cases
    CreateAlertPolicyUseCase,
    UpdateAlertPolicyUseCase,
    EnableDisableAlertPolicyUseCase,
    ListPoliciesUseCase,
    ListAlertEventsUseCase,
    AcknowledgeAlertEventUseCase,
  ],
})
export class AlertsModule {}
