import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateHotelDto {
  @IsString()
  name: string;

  @IsNumber()
  roomRent: number;

  @IsOptional()
  @IsString()
  facilities?: string;

  @IsOptional()
  @IsString()
  contactInfo?: string; // Renamed from contactDetails

  @IsOptional()
  @IsNumber()
  destinationId?: number; // Added destination FK
}
