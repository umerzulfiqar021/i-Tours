import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { HotelService } from './hotel.service';
import { Hotel } from '../../database/entities/Hotel.entity';
import { CreateHotelDto } from './dto/create-hotel.dto';

@Controller('hotels')
export class HotelController {
  constructor(private readonly hotelService: HotelService) {}

  @Post()
  create(@Body() createHotelDto: CreateHotelDto): Promise<Hotel> {
    return this.hotelService.create(createHotelDto);
  }

  @Get()
  findAll(): Promise<Hotel[]> {
    return this.hotelService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Hotel> {
    return this.hotelService.findOne(+id);
  }

  @Get('destination/:destinationId')
  findByDestination(
    @Param('destinationId') destinationId: string,
  ): Promise<Hotel[]> {
    return this.hotelService.findByDestinationId(+destinationId);
  }
}
