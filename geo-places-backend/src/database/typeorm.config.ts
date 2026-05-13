import 'dotenv/config';
import { DataSource } from 'typeorm';
import { PlaceEntity } from '../places/entities/place.entity';

function shouldUseDatabaseSsl() {
  if (process.env.DB_SSL) {
    return process.env.DB_SSL.toLowerCase() === 'true'
      ? { rejectUnauthorized: false }
      : false;
  }

  return process.env.DATABASE_URL?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false;
}

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'geo_places',
  entities: [PlaceEntity],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
  connectTimeoutMS: 5000,
  ssl: shouldUseDatabaseSsl(),
});
