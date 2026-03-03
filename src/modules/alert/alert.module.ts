import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from '../../database/entities/Alert.entity';
import { TripPlan } from '../../database/entities/TripPlan.entity';
import { AlertController } from './alert.controller';
import { AlertService } from './alert.service';
import { ExternalDataModule } from '../external-data/external-data.module';

@Module({
  imports: [TypeOrmModule.forFeature([Alert, TripPlan]), ExternalDataModule],
  controllers: [AlertController],
  providers: [AlertService],
  exports: [AlertService],
})
export class AlertModule {}
