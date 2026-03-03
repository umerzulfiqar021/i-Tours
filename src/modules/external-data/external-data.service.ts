import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ExternalDataService {
  private readonly logger = new Logger(ExternalDataService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Fetches 5-day weather forecast from RapidAPI.
   * @param latitude Latitude of the location
   * @param longitude Longitude of the location
   */
  async getWeather(latitude: string, longitude: string) {
    try {
      const apiKey = this.configService.get<string>('X_RAPIDAPI_KEY');
      const host = this.configService.get<string>('X_RAPIDAPI_HOST');

      if (!apiKey || !host) {
        this.logger.error('RapidAPI configuration missing in environment.');
        throw new Error('RapidAPI configuration missing');
      }

      this.logger.log(
        `Fetching weather for lat: ${latitude}, lon: ${longitude}`,
      );

      const response = await fetch(
        `https://${host}/fivedaysforcast?latitude=${latitude}&longitude=${longitude}&lang=EN`,
        {
          method: 'GET',
          headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': host,
          },
        },
      );

      if (!response.ok) {
        this.logger.error(
          `RapidAPI Error: ${response.status} ${response.statusText}`,
        );
        const errorBody = await response.text();
        this.logger.debug(`Error details: ${errorBody}`);
        throw new Error(`External API returned ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      this.logger.error(`Failed to fetch weather data: ${error.message}`);
      return null; // Return null instead of throwing
    }
  }

  /**
   * Fetches hotels by coordinates from Booking.com RapidAPI.
   */
  async getHotelsByCoordinates(params: {
    latitude: string;
    longitude: string;
    arrival_date: string;
    departure_date: string;
    adults?: string;
    children_age?: string;
    room_qty?: string;
  }) {
    try {
      const apiKey = this.configService.get<string>('X_RAPIDAPI_KEY');
      const host = this.configService.get<string>('X_RAPIDAPI_BOOKING_HOST');

      if (!apiKey || !host) {
        this.logger.error(
          'Booking.com API configuration missing in environment.',
        );
        throw new Error('Booking.com API configuration missing');
      }

      const queryParams = new URLSearchParams({
        latitude: params.latitude,
        longitude: params.longitude,
        arrival_date: params.arrival_date,
        departure_date: params.departure_date,
        adults: params.adults || '1',
        room_qty: params.room_qty || '1',
        units: 'metric',
        temperature_unit: 'c',
        languagecode: 'en-us',
        currency_code: 'EUR',
      });

      if (params.children_age) {
        queryParams.append('children_age', params.children_age);
      }

      this.logger.log(
        `Fetching hotels for lat: ${params.latitude}, lon: ${params.longitude}`,
      );

      const response = await fetch(
        `https://${host}/api/v1/hotels/searchHotelsByCoordinates?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': host,
          },
        },
      );

      if (!response.ok) {
        this.logger.error(
          `Booking API Error: ${response.status} ${response.statusText}`,
        );
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      this.logger.error(`Failed to fetch hotel data: ${error.message}`);
      return null;
    }
  }
}
