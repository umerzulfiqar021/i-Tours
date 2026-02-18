import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripPlan } from '../../database/entities/TripPlan.entity';
import { User } from '../../database/entities/User.entity';
import { Destination } from '../../database/entities/Destination.entity';
import { CreateTripPlanDto } from './dto/create-trip-plan.dto';

@Injectable()
export class TripPlanService {
  constructor(
    @InjectRepository(TripPlan)
    private tripPlanRepository: Repository<TripPlan>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Destination)
    private destinationRepository: Repository<Destination>,
  ) {}

  async create(createTripPlanDto: CreateTripPlanDto): Promise<TripPlan> {
    const user = await this.userRepository.findOneBy({ id: createTripPlanDto.userId });
    if (!user) {
      throw new NotFoundException('User not found. Cannot create trip plan for non-existent user.');
    }

    const tripPlan = this.tripPlanRepository.create({
      tripType: createTripPlanDto.tripType,
      numberOfPersons: createTripPlanDto.numberOfPersons,
      stayDuration: createTripPlanDto.stayDuration,
      startDate: createTripPlanDto.startDate,
      endDate: createTripPlanDto.endDate,
      routePath: createTripPlanDto.routePath,
      status: createTripPlanDto.status || 'planned',
      destination: { id: createTripPlanDto.destinationId } as any,
      user: user,
    });

    return this.tripPlanRepository.save(tripPlan);
  }

  async findOne(id: number): Promise<TripPlan> {
    const tripPlan = await this.tripPlanRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!tripPlan) {
      throw new NotFoundException('Trip plan not found. It may have been deleted or never existed.');
    }
    return tripPlan;
  }

  async findByUser(userId: number): Promise<TripPlan[]> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.tripPlanRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
}
