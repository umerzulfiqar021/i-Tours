import { IsString, IsEnum, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { Severity } from '../../../database/entities/Alert.entity';

export class CreateAlertDto {
  @IsString()
  type: string;

  @IsString()
  message: string;

  @IsEnum(Severity)
  severity: Severity;

  @Type(() => Date)
  @IsDate()
  timestamp: Date;
}
