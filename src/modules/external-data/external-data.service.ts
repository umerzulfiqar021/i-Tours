import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Service to handle data integration from third-party APIs (Weather & Booking).
 * Manages external dependencies and standardizes data format.
 */
@Injectable()
export class ExternalDataService {

  private readonly logger = new Logger(ExternalDataService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Fetches real-time 5-day weather forecast using OpenWeather API via RapidAPI.
   * Logic handles API key validation and network failures.
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
   * Fetches hotel lists from Booking.com API via RapidAPI.
   * Includes custom error handling for "status: false" responses from RapidAPI.
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

      if (data && data.status === false) {
        this.logger.error(
          `Booking API returned error status: ${JSON.stringify(data.message) || 'Unknown error'}`,
        );
        return null;
      }

      return data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch hotel data: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Fetches specific hotel details from Booking.com API via RapidAPI.
   * Mandates hotel_id. Uses today/tomorrow as default arrival/departure dates.
   */
  async getHotelDetails(params: {
    hotel_id: string;
    arrival_date?: string;
    departure_date?: string;
    adults?: string;
    children_age?: string;
    room_qty?: string;
  }) {
    try {
      const apiKey = this.configService.get<string>('X_RAPIDAPI_KEY');
      const host = this.configService.get<string>('X_RAPIDAPI_BOOKING_HOST');

      if (!apiKey || !host) {
        throw new Error('Booking.com API configuration missing');
      }

      // Default Date Logic: Today & Tomorrow
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      const arrival = params.arrival_date || today.toISOString().split('T')[0];
      const departure =
        params.departure_date || tomorrow.toISOString().split('T')[0];

      const queryParams = new URLSearchParams({
        hotel_id: params.hotel_id,
        arrival_date: arrival,
        departure_date: departure,
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

      this.logger.log(`Fetching specific details for hotel_id: ${params.hotel_id}`);

      const response = await fetch(
        `https://${host}/api/v1/hotels/getHotelDetails?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': host,
          },
        },
      );

      if (!response.ok) {
        this.logger.error(`Booking Details API Error: ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Failed to fetch hotel details: ${error.message}`);
      return null;
    }
  }
}



