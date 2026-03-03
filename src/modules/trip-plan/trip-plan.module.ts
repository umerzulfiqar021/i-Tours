import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripPlan } from '../../database/entities/TripPlan.entity';
import { User } from '../../database/entities/User.entity';
import { Destination } from '../../database/entities/Destination.entity';
import { TripPlanController } from './trip-plan.controller';
import { TripPlanService } from './trip-plan.service';
import { IntelligenceModule } from '../intelligence/intelligence.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TripPlan, User, Destination]),
    IntelligenceModule,
  ],
  controllers: [TripPlanController],
  providers: [TripPlanService],
})
export class TripPlanModule {}
