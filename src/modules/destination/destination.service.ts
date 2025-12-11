import { Injectable, NotFoundException } from '@nestjs/common';
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

  create(createDestinationDto: CreateDestinationDto): Promise<Destination> {
    const destination = this.destinationRepository.create(createDestinationDto);
    return this.destinationRepository.save(destination);
  }

  findAll(): Promise<Destination[]> {
    return this.destinationRepository.find();
  }

  async findOne(id: number): Promise<Destination> {
    const destination = await this.destinationRepository.findOneBy({ id });
    if (!destination) {
      throw new NotFoundException(`Destination with ID ${id} not found`);
    }
    return destination;
  }
}
