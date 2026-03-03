import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ExternalDataService } from './external-data.service';

@Controller('external-data')
export class ExternalDataController {
  constructor(private readonly externalDataService: ExternalDataService) {}

  /**
   * GET /external-data/weather
   * Example: /external-data/weather?lat=40.730610&lon=-73.935242
   */
  @Get('weather')
  async getWeather(@Query('lat') lat: string, @Query('lon') lon: string) {
    if (!lat || !lon) {
      throw new BadRequestException(
        'Latitude (lat) and Longitude (lon) are required.',
      );
    }
    return this.externalDataService.getWeather(lat, lon);
  }

  /**
   * GET /external-data/hotels (Placeholder)
   */
  @Get('hotels')
  async getHotels(@Query('destination') destination: string) {
    if (!destination) {
      throw new BadRequestException('Destination is required.');
    }
    return this.externalDataService.getHotels(destination);
  }
}
