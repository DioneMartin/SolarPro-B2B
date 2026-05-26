import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AuthModule } from './shared/auth/auth.module';
import { JwtAuthGuard } from './shared/auth/jwt-auth.guard';
import { RolesGuard } from './shared/auth/roles.guard';
import { DatabaseModule } from './shared/database/database.module';
import { GlobalExceptionFilter } from './shared/errors/global-exception.filter';
import { EventBusModule } from './shared/event-bus/event-bus.module';
import { RedisHealth } from './shared/event-bus/redis.health';
import { TenantContextInterceptor } from './shared/tenant-context/tenant-context.interceptor';
import { TenantContextModule } from './shared/tenant-context/tenant-context.module';
import { CatalogModule } from './catalog/infrastructure/catalog.module';
import { ProjectClientModule } from './project-client/infrastructure/project-client.module';
import { UserTenantModule } from './user-tenant/infrastructure/user-tenant.module';
import { DataIngestionModule } from './data-ingestion/infrastructure/data-ingestion.module';
import { SolarCalculationModule } from './solar-calculation/infrastructure/solar-calculation.module';
import { ProposalGeneratorModule } from './proposal-generator/infrastructure/proposal-generator.module';
import { AlertsModule } from './alerts/infrastructure/alerts.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule,
    AuthModule,
    TenantContextModule,
    EventBusModule,
    UserTenantModule,
    ProjectClientModule,
    CatalogModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6380,
        },
      }),
    }),
    DataIngestionModule,
    SolarCalculationModule,
    ProposalGeneratorModule,
    AlertsModule,
  ],
  controllers: [AppController],
  providers: [
    RedisHealth,
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
  ],
})
export class AppModule {}
