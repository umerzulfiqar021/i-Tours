import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TripPlanService } from './trip-plan.service';
import { TripPlan } from '../../database/entities/TripPlan.entity';
import { CreateTripPlanDto } from './dto/create-trip-plan.dto';

@Controller('trip-plans')
export class TripPlanController {
  constructor(private readonly tripPlanService: TripPlanService) {}

  @Post()
  create(@Body() createTripPlanDto: CreateTripPlanDto): Promise<TripPlan> {
    return this.tripPlanService.create(createTripPlanDto);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string): Promise<TripPlan[]> {
    return this.tripPlanService.findByUser(+userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<TripPlan> {
    return this.tripPlanService.findOne(+id);
  }
}
