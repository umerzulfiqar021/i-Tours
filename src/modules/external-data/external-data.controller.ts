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

    // Date Validation
    const arrivalDate = new Date(arrival);
    const departureDate = new Date(departure);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(arrivalDate.getTime()) || isNaN(departureDate.getTime())) {
      throw new BadRequestException('Invalid arrival or departure date format.');
    }

    if (arrivalDate < today) {
      throw new BadRequestException('Arrival date cannot be in the past.');
    }

    if (departureDate <= arrivalDate) {
      throw new BadRequestException('Departure date must be after the arrival date.');
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

  /**
   * GET /external-data/hotel-details
   * Example: /external-data/hotel-details?hotel_id=191605
   */
  @Get('hotel-details')
  async getHotelDetails(
    @Query('hotel_id') hotelId: string,
    @Query('arrival') arrival?: string,
    @Query('departure') departure?: string,
    @Query('adults') adults?: string,
    @Query('children_age') children_age?: string,
    @Query('room_qty') room_qty?: string,
  ) {
    if (!hotelId) {
      throw new BadRequestException('hotel_id is required.');
    }

    return this.externalDataService.getHotelDetails({
      hotel_id: hotelId,
      arrival_date: arrival,
      departure_date: departure,
      adults,
      children_age,
      room_qty,
    });
  }
}




