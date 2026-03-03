import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from '../../database/entities/City.entity';
import * as fs from 'fs';
import * as readline from 'readline';
import * as path from 'path';

/**
 * Service to manage Pakistan Cities database.
 * Handles data import from GeoNames PK.txt and provides search functionality.
 */
@Injectable()
export class CityService implements OnModuleInit {

  private readonly logger = new Logger(CityService.name);

  constructor(
    @InjectRepository(City)
    private cityRepository: Repository<City>,
  ) {}

  /**
   * Triggers the GeoNames data import automatically when the module initializes
   * if the cities table is completely empty.
   */
  async onModuleInit() {

    // Check if cities table is empty, if so, trigger import
    const count = await this.cityRepository.count();
    if (count === 0) {
      this.logger.log('Cities table is empty. Starting GeoNames import...');
      await this.importCities();
    }
  }

  /**
   * Imports cities from the PK.txt file in the root directory.
   * Filters for populated places ('P'), parses tab-separated values,
   * and performs batched database insertion.
   */
  async importCities() {

    const filePath = path.join(process.cwd(), 'PK.txt');
    if (!fs.existsSync(filePath)) {
      this.logger.error(`PK.txt not found at ${filePath}`);
      return;
    }

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let count = 0;
    const batchSize = 500;
    let batch: Partial<City>[] = [];

    for await (const line of rl) {
      const parts = line.split('\t');
      if (parts.length < 19) continue;

      const featureClass = parts[6];
      if (featureClass !== 'P') continue;

      const population = parseInt(parts[14], 10) || 0;
      // Optional: Skip population < 1000 if needed, but the user said "populated places"
      // and only mentioned skip < 1000 as optional optimization. Let's keep all for now
      // unless it's too many.

      const city: Partial<City> = {
        id: parseInt(parts[0], 10),
        name: parts[1],
        asciiname: parts[2],
        latitude: parseFloat(parts[4]),
        longitude: parseFloat(parts[5]),
        feature_class: parts[6],
        feature_code: parts[7],
        country_code: parts[8],
        population: population,
        timezone: parts[17],
        modification_date: parts[18] ? new Date(parts[18]) : null,
      };

      batch.push(city);

      if (batch.length >= batchSize) {
        await this.cityRepository
          .createQueryBuilder()
          .insert()
          .into(City)
          .values(batch)
          .orIgnore() // Handle duplicates safely
          .execute();
        count += batch.length;
        this.logger.log(`Imported ${count} cities...`);
        batch = [];
      }
    }

    if (batch.length > 0) {
      await this.cityRepository
        .createQueryBuilder()
        .insert()
        .into(City)
        .values(batch)
        .orIgnore()
        .execute();
      count += batch.length;
    }

    this.logger.log(`Import completed. Total cities imported: ${count}`);
  }

  /**
   * Provides rapid autocompletion for city names.
   * Results are sorted by population descending to prioritize major cities.
   * @param query The search string (min 2 characters)
   */
  async autocomplete(query: string) {

    if (!query || query.length < 2) {
      return [];
    }

    return this.cityRepository
      .createQueryBuilder('city')
      .select(['city.id', 'city.name', 'city.latitude', 'city.longitude', 'city.population'])
      .where('LOWER(city.name) LIKE LOWER(:query)', { query: `%${query}%` })
      .orderBy('city.population', 'DESC')
      .limit(10)
      .getMany();
  }

  /**
   * Fetches full city metadata by its unique GeoNames ID.
   * @param id The GeoNames ID
   */
  async findOne(id: number) {

    return this.cityRepository.findOne({ where: { id } });
  }
}
