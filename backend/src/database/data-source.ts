import 'dotenv/config';
import { join } from 'node:path';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'edumind',
  password: process.env.DB_PASSWORD ?? 'edumind_dev_password',
  database: process.env.DB_DATABASE ?? 'edumind',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [join(__dirname, '../modules/**/*.entity{.js,.ts}')],
  migrations: [join(__dirname, 'migrations/*{.js,.ts}')],
  synchronize: false,
  migrationsTableName: 'typeorm_migrations',
});
