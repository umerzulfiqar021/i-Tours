import { IsString, IsEnum, IsDate, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { RiskLevel } from '../../../database/entities/Alert.entity';

export class CreateAlertDto {
  @IsEnum(RiskLevel)
  riskLevel: RiskLevel;

  @IsString()
  alertType: string;

  @IsString()
  message: string;

  @Type(() => Date)
  @IsDate()
  timestamp: Date;

  @IsNumber()
  tripPlanId: number;
}
