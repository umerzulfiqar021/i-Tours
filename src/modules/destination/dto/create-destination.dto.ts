import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateDestinationDto {
  @IsString()
  name: string;

  @IsString()
  location: string;

  @IsString()
  category: string;

  @IsString()
  budgetRange: string;

  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number;
}

export class GetDestinationsDto {
  @IsOptional()
  @IsString()
  country?: string; // Filter by specific country

  @IsOptional()
  @IsString()
  category?: string; // Filter by category

  @IsOptional()
  @IsString()
  budgetRange?: string; // Filter by budget range

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number; // Minimum rating filter
}
