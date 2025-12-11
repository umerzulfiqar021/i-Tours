import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripPlan } from '../../database/entities/TripPlan.entity';
import { TripPlanController } from './trip-plan.controller';
import { TripPlanService } from './trip-plan.service';

@Module({
  imports: [TypeOrmModule.forFeature([TripPlan])],
  controllers: [TripPlanController],
  providers: [TripPlanService],
})
export class TripPlanModule {}
