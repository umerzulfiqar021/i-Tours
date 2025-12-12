import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from '../../database/entities/Alert.entity';
import { CreateAlertDto } from './dto/create-alert.dto';

@Injectable()
export class AlertService {
  constructor(
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
  ) {}

  async create(createAlertDto: CreateAlertDto): Promise<Alert> {
    const alert = this.alertRepository.create(createAlertDto);
    return this.alertRepository.save(alert);
  }

  findAll(): Promise<Alert[]> {
    return this.alertRepository.find();
  }

  async findOne(id: number): Promise<Alert> {
    const alert = await this.alertRepository.findOneBy({ id });
    if (!alert) {
      throw new NotFoundException('Alert not found. It may have expired or been removed from the system.');
    }
    return alert;
  }
}
