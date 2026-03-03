import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hotel } from '../../database/entities/Hotel.entity';
import { CreateHotelDto } from './dto/create-hotel.dto';

@Injectable()
export class HotelService {
  private readonly logger = new Logger(HotelService.name);

  constructor(
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
  ) {}

  /**
   * Registers a new hotel in the system.
   * Prevents duplicates by checking the hotel name.
   *
   * @param createHotelDto Hotel details
   * @returns The saved hotel entity
   */
  async create(createHotelDto: CreateHotelDto): Promise<Hotel> {
    const existingHotel = await this.hotelRepository.findOne({
      where: { name: createHotelDto.name },
    });

    if (existingHotel) {
      throw new ConflictException(
        `The hotel "${createHotelDto.name}" is already registered in our system.`,
      );
    }

    const hotel = this.hotelRepository.create(createHotelDto);
    return this.hotelRepository.save(hotel);
  }

  /**
   * Retrieves a list of all hotels available in the system.
   */
  findAll(): Promise<Hotel[]> {
    return this.hotelRepository.find();
  }

  /**
   * Finds a specific hotel by its ID.
   *
   * @param id Unique hotel identifier
   * @returns The hotel entity
   */
  async findOne(id: number): Promise<Hotel> {
    const hotel = await this.hotelRepository.findOneBy({ id });

    if (!hotel) {
      throw new NotFoundException(
        `The requested hotel (ID: ${id}) could not be found. It may have been removed or updated.`,
      );
    }

    return hotel;
  }
}
