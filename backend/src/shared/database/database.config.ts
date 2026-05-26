import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function buildTypeOrmOptions(config: ConfigService): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: config.get<string>('DB_HOST', 'localhost'),
    port: Number(config.get<string>('DB_PORT', '5432')),
    username: config.get<string>('DB_USER', 'solaruser'),
    password: config.get<string>('DB_PASSWORD', 'solarpassword'),
    database: config.get<string>('DB_NAME', 'solardb'),
    autoLoadEntities: true,
    // Local dev only. Production uses migrations.
    synchronize: config.get<string>('NODE_ENV', 'development') === 'development',
    logging: false,
  };
}
