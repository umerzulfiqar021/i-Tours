import { IsString, IsNumber } from 'class-validator';

export class CreateHotelDto {
  @IsString()
  name: string;

  @IsNumber()
  roomRent: number;

  @IsNumber()
  rating: number;

  @IsString()
  contactDetails: string;
}
