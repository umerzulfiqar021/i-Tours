import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntelligenceInsight } from '../../database/entities/IntelligenceInsight.entity';
import { TripPlan } from '../../database/entities/TripPlan.entity';
import { Hotel } from '../../database/entities/Hotel.entity';
import { IntelligenceController } from './intelligence.controller';
import { IntelligenceService } from './intelligence.service';
import { IntelligenceGateway } from './intelligence.gateway';
import { ExternalDataModule } from '../external-data/external-data.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([IntelligenceInsight, TripPlan, Hotel]),
    ExternalDataModule,
  ],
  controllers: [IntelligenceController],
  providers: [IntelligenceService, IntelligenceGateway],
  exports: [IntelligenceService, IntelligenceGateway],
})
export class IntelligenceModule {}
