import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { WeatherService } from './weather.service';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  /**
   * Get real-time weather alerts and current conditions for a city.
   * Example: GET /weather?q=london
   */
  @Get()
  async getWeather(@Query('q') query: string) {
    if (!query) {
      throw new BadRequestException('Location query (q) is required. Example: /weather?q=paris');
    }
    return this.weatherService.getRapidAPIWeather(query);
  }
}
