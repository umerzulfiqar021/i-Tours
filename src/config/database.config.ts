import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: true,
    ssl:
      process.env.DB_HOST !== 'localhost' &&
      process.env.DB_HOST !== '127.0.0.1',
    extra: {
      ssl:
        process.env.DB_HOST !== 'localhost' &&
        process.env.DB_HOST !== '127.0.0.1'
          ? {
              rejectUnauthorized: false,
            }
          : false,
    },
  }),
);
