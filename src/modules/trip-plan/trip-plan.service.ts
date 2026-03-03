import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripPlan } from '../../database/entities/TripPlan.entity';
import { User } from '../../database/entities/User.entity';
import { Destination } from '../../database/entities/Destination.entity';
import { CreateTripPlanDto } from './dto/create-trip-plan.dto';

@Injectable()
export class TripPlanService {
  private readonly logger = new Logger(TripPlanService.name);

  constructor(
    @InjectRepository(TripPlan)
    private readonly tripPlanRepository: Repository<TripPlan>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Destination)
    private readonly destinationRepository: Repository<Destination>,
  ) {}

  /**
   * Creates a new trip plan for a user.
   * Validates user existence before proceeding.
   *
   * @param createTripPlanDto Details of the trip plan
   * @returns The created trip plan
   */
  async create(createTripPlanDto: CreateTripPlanDto): Promise<TripPlan> {
    const user = await this.userRepository.findOneBy({
      id: createTripPlanDto.userId,
    });
    if (!user) {
      throw new NotFoundException(
        `The user (ID: ${createTripPlanDto.userId}) was not found. Trip plans must be linked to a valid user account.`,
      );
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

  /**
   * Retrieves a specific trip plan by its unique ID.
   * Includes user details in the result.
   */
  async findOne(id: number): Promise<TripPlan> {
    const tripPlan = await this.tripPlanRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!tripPlan) {
      throw new NotFoundException(
        `The trip plan (ID: ${id}) could not be located. It may have been deleted.`,
      );
    }

    return tripPlan;
  }

  /**
   * Lists all trip plans associated with a specific user.
   * Returns plans ordered by creation date, newest first.
   */
  async findByUser(userId: number): Promise<TripPlan[]> {
    const userExists = await this.userRepository.findOneBy({ id: userId });
    if (!userExists) {
      throw new NotFoundException(`User profile (ID: ${userId}) not found.`);
    }

    return this.tripPlanRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
}
