import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Destination } from '../../database/entities/Destination.entity';
import { CreateDestinationDto, GetDestinationsDto } from './dto/create-destination.dto';

@Injectable()
export class DestinationService {
  constructor(
    @InjectRepository(Destination)
    private destinationRepository: Repository<Destination>,
  ) {}

  // Fetch destinations from free OpenStreetMap Nominatim API
  async fetchFromNominatim(query: string, limit: number = 10): Promise<any[]> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}&extratags=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'i-Tours-App/1.0 (your-email@example.com)', // Required by Nominatim
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform Nominatim data to our format
      return data.map(place => ({
        name: place.display_name.split(',')[0],
        location: place.display_name,
        category: this.categorizePlace(place.type, place.extratags),
        budgetRange: 'medium', // Default, can be enhanced later
        rating: 4.0, // Default rating
        latitude: place.lat,
        longitude: place.lon,
        source: 'nominatim'
      }));
    } catch (error) {
      console.error('Error fetching from Nominatim:', error);
      return [];
    }
  }

  // Categorize places based on Nominatim data
  private categorizePlace(type: string, extratags: any): string {
    if (type.includes('museum') || extratags?.historic) return 'Historical';
    if (type.includes('park') || type.includes('natural')) return 'Natural';
    if (type.includes('religious') || extratags?.amenity === 'place_of_worship') return 'Religious';
    if (type.includes('beach') || type.includes('water')) return 'Beach';
    if (type.includes('shop') || type.includes('mall')) return 'Shopping';
    if (type.includes('tourism')) return 'Tourism';
    return 'Cultural';
  }

  // Get worldwide destinations using free API
  async getWorldwideDestinations(query?: string): Promise<any[]> {
    const searches = query ? [query] : [
      'famous landmarks world',
      'tourist attractions Asia',
      'UNESCO World Heritage Sites',
      'popular destinations Europe'
    ];

    let allDestinations: any[] = [];
    
    for (const searchQuery of searches) {
      const results = await this.fetchFromNominatim(searchQuery, 15);
      allDestinations = [...allDestinations, ...results];
    }

    // Remove duplicates and return
    const uniqueDestinations = allDestinations.filter((dest: any, index: number, self: any[]) => 
      index === self.findIndex((d: any) => d.name === dest.name)
    );

    return uniqueDestinations.slice(0, 50); // Limit to 50 results
  }

  // Create a new destination
  async create(createDestinationDto: CreateDestinationDto): Promise<Destination> {
    const destination = this.destinationRepository.create(createDestinationDto);
    return await this.destinationRepository.save(destination);
  }

  // Get destinations with various filtering options
  async getDestinations(filters?: GetDestinationsDto): Promise<Destination[]> {
    const query = this.destinationRepository.createQueryBuilder('destination');

    if (filters?.country) {
      query.andWhere('destination.location ILIKE :country', { 
        country: `%${filters.country}%` 
      });
    }

    if (filters?.category) {
      query.andWhere('destination.category = :category', { 
        category: filters.category 
      });
    }

    if (filters?.budgetRange) {
      query.andWhere('destination.budgetRange = :budgetRange', { 
        budgetRange: filters.budgetRange 
      });
    }

    if (filters?.minRating) {
      query.andWhere('destination.rating >= :minRating', { 
        minRating: filters.minRating 
      });
    }

    return await query.getMany();
  }

  // Get all destinations from Pakistan only
  async getPakistanDestinations(): Promise<Destination[]> {
    return await this.destinationRepository.find({
      where: { location: Like('%Pakistan%') },
    });
  }

  // Get all destinations worldwide
  async getAllDestinations(): Promise<Destination[]> {
    return await this.destinationRepository.find();
  }

  // Get destinations by specific country
  async getDestinationsByCountry(country: string): Promise<Destination[]> {
    return await this.destinationRepository.find({
      where: { location: Like(`%${country}%`) },
    });
  }

  // Get destinations by specific area/city
  async getDestinationsByArea(area: string): Promise<Destination[]> {
    return await this.destinationRepository.find({
      where: { location: Like(`%${area}%`) },
    });
  }

  // Find one destination by ID
  async findOne(id: number): Promise<Destination> {
    const destination = await this.destinationRepository.findOne({
      where: { id },
      relations: ['hotels'],
    });
    
    if (!destination) {
      throw new NotFoundException(`Destination with ID ${id} not found`);
    }
    
    return destination;
  }

  // Import destinations from API to populate the database properly
  async importDestinationsFromApi(): Promise<void> {
    const searchQueries = [
      'tourist attractions in Pakistan',
      'famous landmarks Paris',
      'top destinations in London',
      'historical places in Turkey',
      'tourist spots in Dubai'
    ];

    console.log('Starting destination import from Nominatim API...');

    for (const query of searchQueries) {
      const results = await this.fetchFromNominatim(query, 10);
      
      for (const result of results) {
        // Check if destination matches an existing one by name
        const existing = await this.destinationRepository.findOne({
          where: { name: result.name }
        });

        if (!existing) {
          await this.destinationRepository.save({
            name: result.name,
            location: result.location,
            category: result.category,
            budgetRange: result.budgetRange,
            rating: result.rating
          });
        }
      }
    }
    console.log('Destination import completed.');
  }

  // TODO: Add Google Places API integration
  // async fetchFromGooglePlaces(query: string): Promise<any> {
  //   const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  //   const response = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}`);
  //   return response.json();
  // }

  // TODO: Add manual JSON file import
  // async importFromJSON(filePath: string): Promise<void> {
  //   const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  //   // Process and save destinations
  // }
}