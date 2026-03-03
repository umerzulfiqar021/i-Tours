import { IsString, IsEnum, IsDate, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { RiskLevel } from '../../../database/entities/IntelligenceInsight.entity';

export class CreateIntelligenceDto {
  @IsEnum(RiskLevel)
  riskLevel: RiskLevel;

  @IsString()
  insightType: string;

  @IsString()
  message: string;

  @Type(() => Date)
  @IsDate()
  timestamp: Date;

  @IsNumber()
  tripPlanId: number;
}
