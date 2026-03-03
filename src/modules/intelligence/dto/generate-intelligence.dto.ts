import { IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';

export class GenerateIntelligenceDto {
  @IsOptional()
  @IsNumber()
  tripPlanId?: number;

  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional()
  @IsString()
  latitude?: string;

  @IsOptional()
  @IsString()
  longitude?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  userLocation?: string;
}
