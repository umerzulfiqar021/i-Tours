import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripPlan } from '../../database/entities/TripPlan.entity';
import { CreateTripPlanDto } from './dto/create-trip-plan.dto';

@Injectable()
export class TripPlanService {
  constructor(
    @InjectRepository(TripPlan)
    private tripPlanRepository: Repository<TripPlan>,
  ) {}

  create(createTripPlanDto: CreateTripPlanDto): Promise<TripPlan> {
    const tripPlan = this.tripPlanRepository.create(createTripPlanDto);
    return this.tripPlanRepository.save(tripPlan);
  }

  findAll(): Promise<TripPlan[]> {
    return this.tripPlanRepository.find();
  }

  async findOne(id: number): Promise<TripPlan> {
    const tripPlan = await this.tripPlanRepository.findOneBy({ id });
    if (!tripPlan) {
      throw new NotFoundException(`TripPlan with ID ${id} not found`);
    }
    return tripPlan;
  }
}
