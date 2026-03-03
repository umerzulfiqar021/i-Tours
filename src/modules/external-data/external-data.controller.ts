import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ExternalDataService } from './external-data.service';

@Controller('external-data')
export class ExternalDataController {
  constructor(private readonly externalDataService: ExternalDataService) {}

  /**
   * GET /external-data/hotels
   * Example: /external-data/hotels?lat=19.24&lon=72.85&arrival=2024-10-10&departure=2024-10-15
   */
  @Get('hotels')
  async getHotels(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
    @Query('arrival') arrival: string,
    @Query('departure') departure: string,
    @Query('adults') adults?: string,
    @Query('children_age') children_age?: string,
    @Query('room_qty') room_qty?: string,
  ) {
    if (!lat || !lon || !arrival || !departure) {
      throw new BadRequestException(
        'Latitude (lat), Longitude (lon), arrival, and departure dates are required.',
      );
    }
    return this.externalDataService.getHotelsByCoordinates({
      latitude: lat,
      longitude: lon,
      arrival_date: arrival,
      departure_date: departure,
      adults,
      children_age,
      room_qty,
    });
  }

  /**
   * GET /external-data/weather
   * Example: /external-data/weather?lat=35.8811&lon=74.4639
   */
  @Get('weather')
  async getWeather(@Query('lat') lat: string, @Query('lon') lon: string) {
    if (!lat || !lon) {
      throw new BadRequestException('Latitude (lat) and Longitude (lon) are required.');
    }
    return this.externalDataService.getWeather(lat, lon);
  }
}
