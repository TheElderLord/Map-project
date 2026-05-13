import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { webcrypto } from 'crypto';
import { PlacesModule } from './places/places.module';
import { PlaceEntity } from './places/entities/place.entity';

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: webcrypto,
  });
}

function shouldUseDatabaseSsl(configService: ConfigService) {
  const configuredValue = configService.get<string>('DB_SSL', '');

  if (configuredValue) {
    return configuredValue.toLowerCase() === 'true'
      ? { rejectUnauthorized: false }
      : false;
  }

  return configService.get<string>('DATABASE_URL', '').includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const baseOptions = {
          type: 'postgres' as const,
          entities: [PlaceEntity],
          synchronize: false,
          connectTimeoutMS: 5000,
          ssl: shouldUseDatabaseSsl(configService),
        };

        if (databaseUrl) {
          return {
            ...baseOptions,
            url: databaseUrl,
          };
        }

        return {
          ...baseOptions,
          host: configService.get<string>('DB_HOST', '127.0.0.1'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_DATABASE', 'geo_places'),
        };
      },
    }),
    PlacesModule,
  ],
})
export class AppModule {}
