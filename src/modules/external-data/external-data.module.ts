import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ExternalDataService } from './external-data.service';
import { ExternalDataController } from './external-data.controller';

@Module({
  imports: [ConfigModule],
  controllers: [ExternalDataController],
  providers: [ExternalDataService],
  exports: [ExternalDataService],
})
export class ExternalDataModule {}
