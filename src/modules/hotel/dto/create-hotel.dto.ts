import { IsString, IsNumber, IsDecimal } from 'class-validator';

export class CreateHotelDto {
  @IsString()
  name: string;

  @IsDecimal()
  roomRent: number;

  @IsDecimal()
  rating: number;

  @IsString()
  contactDetails: string;
}
