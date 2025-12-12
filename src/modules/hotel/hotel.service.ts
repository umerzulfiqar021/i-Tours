import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hotel } from '../../database/entities/Hotel.entity';
import { CreateHotelDto } from './dto/create-hotel.dto';

@Injectable()
export class HotelService {
  constructor(
    @InjectRepository(Hotel)
    private hotelRepository: Repository<Hotel>,
  ) {}

  async create(createHotelDto: CreateHotelDto): Promise<Hotel> {
    const existingHotel = await this.hotelRepository.findOne({
      where: { name: createHotelDto.name },
    });
    if (existingHotel) {
      throw new ConflictException('This hotel is already listed in our system. Please check the hotels list.');
    }
    const hotel = this.hotelRepository.create(createHotelDto);
    return this.hotelRepository.save(hotel);
  }

  findAll(): Promise<Hotel[]> {
    return this.hotelRepository.find();
  }

  async findOne(id: number): Promise<Hotel> {
    const hotel = await this.hotelRepository.findOneBy({ id });
    if (!hotel) {
      throw new NotFoundException('Hotel not found. It may no longer be available or has been removed.');
    }
    return hotel;
  }
}
