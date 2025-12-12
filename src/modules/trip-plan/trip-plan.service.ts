import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
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

  async create(createTripPlanDto: CreateTripPlanDto): Promise<TripPlan> {
    const existingTripPlan = await this.tripPlanRepository.findOne({
      where: { name: createTripPlanDto.name },
    });
    if (existingTripPlan) {
      throw new ConflictException('A trip plan with this name already exists. Please choose a different name for your trip.');
    }
    const tripPlan = this.tripPlanRepository.create(createTripPlanDto);
    return this.tripPlanRepository.save(tripPlan);
  }

  findAll(): Promise<TripPlan[]> {
    return this.tripPlanRepository.find();
  }

  async findOne(id: number): Promise<TripPlan> {
    const tripPlan = await this.tripPlanRepository.findOneBy({ id });
    if (!tripPlan) {
      throw new NotFoundException('Trip plan not found. It may have been deleted or never existed.');
    }
    return tripPlan;
  }
}
