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

      return await response.json();
    } catch (error) {
      this.logger.error(`Failed to fetch weather data: ${error.message}`);
      throw error;
    }
  }

  // Placeholder for future Booking.com integration
  async getHotels(destination: string) {
    this.logger.warn(
      'Hotel fetching not yet implemented in ExternalDataService',
    );
    return { message: 'Hotel fetching coming soon' };
  }
}
