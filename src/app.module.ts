import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { TripPlanModule } from './modules/trip-plan/trip-plan.module';
import { AlertModule } from './modules/alert/alert.module';
import { HotelModule } from './modules/hotel/hotel.module';
import { EmailModule } from './modules/email/email.module';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        configService.get<TypeOrmModuleOptions>('database') as TypeOrmModuleOptions,
      inject: [ConfigService],
    }),
    EmailModule,
    UserModule,
    TripPlanModule,
    AlertModule,
    HotelModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
