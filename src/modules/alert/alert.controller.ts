import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AlertService } from './alert.service';
import { Alert } from '../../database/entities/Alert.entity';
import { CreateAlertDto } from './dto/create-alert.dto';

@Controller('alerts')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Post()
  create(@Body() createAlertDto: CreateAlertDto): Promise<Alert> {
    return this.alertService.create(createAlertDto);
  }

  @Get()
  findAll(): Promise<Alert[]> {
    return this.alertService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Alert> {
    return this.alertService.findOne(+id);
  }
}
