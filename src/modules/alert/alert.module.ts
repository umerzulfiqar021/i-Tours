import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from '../../database/entities/Alert.entity';
import { AlertController } from './alert.controller';
import { AlertService } from './alert.service';

@Module({
  imports: [TypeOrmModule.forFeature([Alert])],
  controllers: [AlertController],
  providers: [AlertService],
})
export class AlertModule {}
