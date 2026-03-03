import { Controller, Get, Query, Param, BadRequestException, NotFoundException } from '@nestjs/common';
import { CityService } from './city.service';

/**
 * REST Controller for city-related operations.
 * Exposes endpoints for autocompletion and detailed city lookup.
 */
@Controller('api/cities')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  /**
   * GET /api/cities/autocomplete?q=lah
   * Provides 10 matching cities for autocompletion UI.
   */
  @Get('autocomplete')
  async autocomplete(@Query('q') query: string) {
    if (!query || query.length < 2) {
      return [];
    }
    return this.cityService.autocomplete(query);
  }

  /**
   * GET /api/cities/:id
   * Returns full geographic and population data for a city.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const cityId = parseInt(id, 10);
    if (isNaN(cityId)) {
      throw new BadRequestException('Invalid city ID');
    }

    const city = await this.cityService.findOne(cityId);
    if (!city) {
      throw new NotFoundException('City not found');
    }
    return city;
  }
}

