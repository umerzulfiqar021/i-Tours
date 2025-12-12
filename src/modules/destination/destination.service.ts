import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Destination } from '../../database/entities/Destination.entity';
import { CreateDestinationDto } from './dto/create-destination.dto';

@Injectable()
export class DestinationService {
  constructor(
    @InjectRepository(Destination)
    private destinationRepository: Repository<Destination>,
  ) {}

  async create(createDestinationDto: CreateDestinationDto): Promise<Destination> {
    const existingDestination = await this.destinationRepository.findOne({
      where: { name: createDestinationDto.name },
    });
    if (existingDestination) {
      throw new ConflictException('This destination has already been added. You can view it in the destinations list.');
    }
    const destination = this.destinationRepository.create(createDestinationDto);
    return this.destinationRepository.save(destination);
  }

  findAll(): Promise<Destination[]> {
    return this.destinationRepository.find();
  }

  async findOne(id: number): Promise<Destination> {
    const destination = await this.destinationRepository.findOneBy({ id });
    if (!destination) {
      throw new NotFoundException('Destination not found. Please check the destination list and try again.');
    }
    return destination;
  }
}
