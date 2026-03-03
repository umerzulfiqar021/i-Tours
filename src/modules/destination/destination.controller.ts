import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { DestinationService } from './destination.service';
import { Destination } from '../../database/entities/Destination.entity';
import {
  CreateDestinationDto,
  GetDestinationsDto,
} from './dto/create-destination.dto';

@Controller('destinations')
export class DestinationController {
  constructor(private readonly destinationService: DestinationService) {}

  // Create a new destination
  @Post()
  create(
    @Body() createDestinationDto: CreateDestinationDto,
  ): Promise<Destination> {
    return this.destinationService.create(createDestinationDto);
  }

  // =============== MANUAL CURATED DESTINATIONS ===============

  // Get destinations with filtering options (from our database)
  @Get('search')
  getDestinations(
    @Query() filters: GetDestinationsDto,
  ): Promise<Destination[]> {
    return this.destinationService.getDestinations(filters);
  }

  // Get all destinations from Pakistan only (manual data)
  // USAGE: Perfect for Pakistan-focused travel app
  @Get('pakistan')
  getPakistanDestinations(): Promise<Destination[]> {
    return this.destinationService.getPakistanDestinations();
  }

  // Get all destinations worldwide (from our curated database)
  // USAGE: When you want manually curated, high-quality destinations
  @Get('worldwide')
  getAllDestinations(): Promise<Destination[]> {
    return this.destinationService.getAllDestinations();
  }

  // Get destinations by specific country (manual data)
  // USAGE: /destinations/country/India or /destinations/country/Turkey
  @Get('country/:country')
  getDestinationsByCountry(
    @Param('country') country: string,
  ): Promise<Destination[]> {
    return this.destinationService.getDestinationsByCountry(country);
  }

  // Get destinations by specific area/city (manual data)
  // USAGE: /destinations/area/Karachi or /destinations/area/Istanbul
  @Get('area/:area')
  getDestinationsByArea(@Param('area') area: string): Promise<Destination[]> {
    return this.destinationService.getDestinationsByArea(area);
  }

  // =============== FREE API DESTINATIONS (OpenStreetMap) ===============

  // Get worldwide destinations using FREE Nominatim API
  // USAGE: When you want fresh data from all over the world
  @Get('api/worldwide')
  async getWorldwideDestinationsAPI(
    @Query('query') query?: string,
  ): Promise<any[]> {
    return this.destinationService.getWorldwideDestinations(query);
  }

  // Search destinations using FREE Nominatim API
  // USAGE: /destinations/api/search?q=museums in paris&limit=10
  @Get('api/search')
  async searchDestinationsAPI(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ): Promise<any[]> {
    const limitNumber = limit ? parseInt(limit) : 10;
    return this.destinationService.fetchFromNominatim(query, limitNumber);
  }

  // =============== UTILITY ENDPOINTS ===============

  // Get single destination by ID
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Destination> {
    return this.destinationService.findOne(+id);
  }

  // Import destinations from External API (OpenStreetMap) to Database
  @Post('import')
  async importDestinations(): Promise<{ message: string; count: number }> {
    await this.destinationService.importDestinationsFromApi();
    const count = await this.destinationService.getAllDestinations();
    return {
      message: 'Destinations imported from Nominatim API successfully!',
      count: count.length,
    };
  }
}
