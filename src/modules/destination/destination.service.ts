import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Destination } from '../../database/entities/Destination.entity';
import {
  CreateDestinationDto,
  GetDestinationsDto,
} from './dto/create-destination.dto';

@Injectable()
export class DestinationService {
  private readonly logger = new Logger(DestinationService.name);

  constructor(
    @InjectRepository(Destination)
    private readonly destinationRepository: Repository<Destination>,
  ) {}

  /**
   * Fetches destination suggestions from OpenStreetMap Nominatim API.
   * This is a free, crowd-sourced API for geocoding and search.
   *
   * @param query The search term (e.g., "Paris", "historical landmarks")
   * @param limit Maximum number of results to return
   * @returns Array of transformed destination objects
   */
  async fetchFromNominatim(query: string, limit: number = 10): Promise<any[]> {
    try {
      this.logger.log(`Fetching destination suggestions for query: "${query}"`);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}&extratags=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'i-Tours-App/1.0 (contact@i-tours.com)', // Informative User-Agent as required by OSM policy
          },
        },
      );

      if (!response.ok) {
        this.logger.error(
          `Nominatim API returned error: ${response.status} ${response.statusText}`,
        );
        return [];
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        this.logger.warn('Nominatim API returned invalid data format');
        return [];
      }

      // Transform Nominatim data into our application's standard format
      return data.map((place) => ({
        name: place.display_name.split(',')[0],
        location: place.display_name,
        category: this.categorizePlace(place.type, place.extratags),
        budgetRange: 'medium', // Default value; can be refined with more data sources
        rating: 4.0, // Placeholder rating
        latitude: place.lat,
        longitude: place.lon,
        source: 'nominatim',
      }));
    } catch (error) {
      this.logger.error(
        `Failed to fetch from Nominatim: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Maps OSM place types to our internal categories using a lookup system.
   *
   * @param type The 'type' field from OSM response
   * @param extratags Additional tags mapping to specific place types
   * @returns A human-readable category string
   */
  private categorizePlace(type: string, extratags: any): string {
    const LowerType = (type || '').toLowerCase();

    // Category mapping logic based on OSM tags
    if (LowerType.includes('museum') || extratags?.historic)
      return 'Historical';
    if (
      LowerType.includes('park') ||
      LowerType.includes('natural') ||
      LowerType.includes('forest')
    )
      return 'Natural';
    if (
      LowerType.includes('religious') ||
      extratags?.amenity === 'place_of_worship'
    )
      return 'Religious';
    if (
      LowerType.includes('beach') ||
      LowerType.includes('water') ||
      LowerType.includes('coast')
    )
      return 'Beach';
    if (LowerType.includes('shop') || LowerType.includes('mall'))
      return 'Shopping';
    if (LowerType.includes('tourism') || LowerType.includes('attraction'))
      return 'Tourism';

    return 'Cultural'; // Generic fallback
  }

  /**
   * Provides a curated list of global destinations.
   * If a query is provided, it searches for that specific term;
   * otherwise, it returns a set of popular global categories.
   */
  async getWorldwideDestinations(query?: string): Promise<any[]> {
    const searchQueries = query
      ? [query]
      : [
          'famous landmarks world',
          'tourist attractions Asia',
          'UNESCO World Heritage Sites',
          'popular destinations Europe',
        ];

    let allResults: any[] = [];

    for (const searchQuery of searchQueries) {
      const results = await this.fetchFromNominatim(searchQuery, 15);
      allResults = [...allResults, ...results];
    }

    // De-duplicate results by name to ensure unique recommendations
    const uniqueResults = allResults.filter(
      (dest, index, self) =>
        index === self.findIndex((d) => d.name === dest.name),
    );

    return uniqueResults.slice(0, 50);
  }

  /**
   * Saves a new destination to the local database.
   */
  async create(
    createDestinationDto: CreateDestinationDto,
  ): Promise<Destination> {
    const destination = this.destinationRepository.create(createDestinationDto);
    return await this.destinationRepository.save(destination);
  }

  /**
   * Searches the local database for destinations using filters.
   */
  async getDestinations(filters?: GetDestinationsDto): Promise<Destination[]> {
    const query = this.destinationRepository.createQueryBuilder('destination');

    if (filters?.country) {
      query.andWhere('destination.location ILIKE :country', {
        country: `%${filters.country}%`,
      });
    }

    if (filters?.category) {
      query.andWhere('destination.category = :category', {
        category: filters.category,
      });
    }

    if (filters?.budgetRange) {
      query.andWhere('destination.budgetRange = :budgetRange', {
        budgetRange: filters.budgetRange,
      });
    }

    if (filters?.minRating) {
      query.andWhere('destination.rating >= :minRating', {
        minRating: filters.minRating,
      });
    }

    return await query.getMany();
  }

  /**
   * Specifically fetches destinations located in Pakistan from the local database.
   */
  async getPakistanDestinations(): Promise<Destination[]> {
    return await this.destinationRepository.find({
      where: { location: Like('%Pakistan%') },
    });
  }

  /**
   * Retrieves all destinations stored in the local database.
   */
  async getAllDestinations(): Promise<Destination[]> {
    return await this.destinationRepository.find();
  }

  /**
   * Gets destinations filtered by a specific country string.
   */
  async getDestinationsByCountry(country: string): Promise<Destination[]> {
    return await this.destinationRepository.find({
      where: { location: Like(`%${country}%`) },
    });
  }

  /**
   * Gets destinations filtered by a specific area or city string.
   */
  async getDestinationsByArea(area: string): Promise<Destination[]> {
    return await this.destinationRepository.find({
      where: { location: Like(`%${area}%`) },
    });
  }

  /**
   * Finds a single destination by its ID, including its associated hotels.
   */
  async findOne(id: number): Promise<Destination> {
    const destination = await this.destinationRepository.findOne({
      where: { id },
      relations: ['hotels'],
    });

    if (!destination) {
      throw new NotFoundException(
        `Destination with ID ${id} not found. Please check your input.`,
      );
    }

    return destination;
  }

  /**
   * Background task to seed the local database with destinations from the Nominatim API.
   * Useful for initial setup or populating a fresh environment.
   */
  async importDestinationsFromApi(): Promise<void> {
    const searchQueries = [
      'tourist attractions in Pakistan',
      'famous landmarks Paris',
      'top destinations in London',
      'historical places in Turkey',
      'tourist spots in Dubai',
    ];

    this.logger.log('Starting destination import from Nominatim API...');

    for (const query of searchQueries) {
      const results = await this.fetchFromNominatim(query, 10);

      for (const result of results) {
        // Prevent duplicate imports based on destination name
        const existing = await this.destinationRepository.findOne({
          where: { name: result.name },
        });

        if (!existing) {
          await this.destinationRepository.save({
            name: result.name,
            location: result.location,
            category: result.category,
            budgetRange: result.budgetRange,
            rating: result.rating,
          });
        }
      }
    }
    this.logger.log('Destination import completed.');
  }
}
