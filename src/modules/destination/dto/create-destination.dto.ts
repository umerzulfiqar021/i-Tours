import { IsString, IsNumber, IsDecimal } from 'class-validator';

export class CreateDestinationDto {
  @IsString()
  name: string;

  @IsDecimal()
  latitude: number;

  @IsDecimal()
  longitude: number;

  @IsString()
  description: string;

  @IsString()
  type: string;
}
