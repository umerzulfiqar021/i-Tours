import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { DestinationService } from './destination.service';
import { Destination } from '../../database/entities/Destination.entity';
import { CreateDestinationDto } from './dto/create-destination.dto';

@Controller('destinations')
export class DestinationController {
  constructor(private readonly destinationService: DestinationService) {}

  @Post()
  create(@Body() createDestinationDto: CreateDestinationDto): Promise<Destination> {
    return this.destinationService.create(createDestinationDto);
  }

  @Get()
  findAll(): Promise<Destination[]> {
    return this.destinationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Destination> {
    return this.destinationService.findOne(+id);
  }
}
