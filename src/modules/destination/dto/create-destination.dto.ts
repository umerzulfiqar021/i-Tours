import { IsString, IsNumber } from 'class-validator';

export class CreateDestinationDto {
  @IsString()
  name: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsString()
  description: string;

  @IsString()
  type: string;
}
