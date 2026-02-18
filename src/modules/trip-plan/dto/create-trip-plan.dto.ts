import { IsString, IsDate, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TripType } from '../../../database/entities/TripPlan.entity';

export class CreateTripPlanDto {
  @IsNumber()
  destinationId: number; // Changed from string destination to destinationId FK

  @IsEnum(TripType, { message: 'Trip type must be one of: friends, solo, family, couple' })
  tripType: TripType;

  @IsNumber()
  @Min(1, { message: 'Number of persons must be at least 1' })
  numberOfPersons: number;

  @IsString()
  stayDuration: string;

  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @IsOptional()
  @IsString()
  routePath?: string; // Added route_path field

  @IsOptional()
  @IsString()
  status?: string; // Added status field

  @IsNumber()
  userId: number;
}
