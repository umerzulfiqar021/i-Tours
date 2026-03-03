import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntelligenceInsight, RiskLevel } from '../../database/entities/IntelligenceInsight.entity';
import { TripPlan } from '../../database/entities/TripPlan.entity';
import { Hotel } from '../../database/entities/Hotel.entity';
import { CreateIntelligenceDto } from './dto/create-intelligence.dto';
import { ExternalDataService } from '../external-data/external-data.service';

@Injectable()
export class IntelligenceService {
  private readonly logger = new Logger(IntelligenceService.name);

  constructor(
    @InjectRepository(IntelligenceInsight)
    private readonly insightRepository: Repository<IntelligenceInsight>,
    @InjectRepository(TripPlan)
    private readonly tripPlanRepository: Repository<TripPlan>,
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
    private readonly externalDataService: ExternalDataService,
  ) {}

  /**
   * Powerful Intelligent Algorithm: Analyzes multiple risk factors to generate travel recommendations.
   * Logic: Scoring-based (0-100) combining Weather, Roads, and Economics.
   */
  async generateIntelligentInsights(
    userId: number,
    tripPlanId: number,
    _userLocation?: string,
  ): Promise<{ insights: IntelligenceInsight[]; hotels: Hotel[] }> {
    const tripPlan = await this.tripPlanRepository.findOne({
      where: { id: tripPlanId, user: { id: userId } },
      relations: ['destination', 'user'],
    });

    if (!tripPlan) {
      throw new NotFoundException(
        `Trip plan ${tripPlanId} not found for user ${userId}.`,
      );
    }

    const lat = tripPlan.latitude?.toString();
    const lon = tripPlan.longitude?.toString();

    if (!lat || !lon) {
      this.logger.warn(
        `Trip plan ${tripPlanId} is missing coordinates. Skipping intelligence generation.`,
      );
      return { insights: [], hotels: [] };
    }

    const destination = tripPlan.destination;

    const insights: IntelligenceInsight[] = [];

    try {
      // 1. Parallel Data Fetching
      const [weatherData, hotelData] = (await Promise.all([
        this.externalDataService.getWeather(lat, lon),
        this.externalDataService.getHotelsByCoordinates({
          latitude: lat,
          longitude: lon,
          arrival_date: tripPlan.startDate.toISOString().split('T')[0],
          departure_date: tripPlan.endDate.toISOString().split('T')[0],
        }),
      ])) as [any, any];

      // 2. POWERFUL ALGORITHM: Scoring & Decision Multi-Factor
      let totalRiskScore = 0; // 0 (Perfect) to 100 (Extremely Dangerous)

      // --- FACTOR 1: WEATHER (40%) ---
      let weatherRisk = 0;
      const weather = weatherData as {
        forecast?: { condition?: string; rain?: number; date?: string }[];
      };
      if (weather && weather.forecast) {
        for (const day of weather.forecast) {
          const condition = (day.condition || '').toLowerCase();
          const rain = day.rain || 0;

          if (rain > 50 || condition.includes('storm')) {
            weatherRisk = Math.max(weatherRisk, 100);
            insights.push(
              this.createInsight(
                RiskLevel.HIGH,
                'weather_hazard',
                `CRITICAL: Flash flood and storm warning for ${day.date || 'upcoming days'}.`,
                tripPlan,
              ),
            );
          } else if (rain > 15 || condition.includes('rain')) {
            weatherRisk = Math.max(weatherRisk, 40);
          }
        }
      }
      totalRiskScore += weatherRisk * 0.4;

      // --- FACTOR 2: ROADS & TERRAIN (40%) ---
      let roadRisk = 0;
      const mountainKeywords = [
        'Hunza',
        'Skardu',
        'Gilgit',
        'Naran',
        'Kalam',
        'Murree',
      ];
      const isMountainous =
        destination?.location &&
        mountainKeywords.some((k) => destination.location.includes(k));

      if (isMountainous && weatherRisk > 30) {
        roadRisk = 100; // Combination of Rain + Mountains = Landslide Hazard
        insights.push(
          this.createInsight(
            RiskLevel.HIGH,
            'natural_hazard',
            `DANGER: Possible landslides in ${destination.name} due to rain in mountainous terrain.`,
            tripPlan,
          ),
        );
      } else if (isMountainous) {
        roadRisk = 50; // High altitude safety advisory
      }
      totalRiskScore += roadRisk * 0.4;

      // --- FACTOR 3: PERSIST RECOMMENDED HOTELS & ECONOMIC SCORE ---
      let economicScore = 0;
      const hotelResult = (hotelData as { result?: any[] })?.result;
      if (hotelResult && hotelResult.length > 0) {
        // Save Top 5 hotels to DB for this specific trip
        const topHotels = hotelResult.slice(0, 5);
        for (const h of topHotels) {
          const hotelData = h as {
            hotel_name?: string;
            price_breakdown?: { all_inclusive_price: string };
            facilities?: string[];
            hotel_id?: string | number;
          };
          const hotelEntry = this.hotelRepository.create({
            name: hotelData.hotel_name || 'System Recommended Hotel',
            roomRent:
              parseFloat(
                hotelData.price_breakdown?.all_inclusive_price || '0',
              ) || 0,
            facilities: (hotelData.facilities || []).join(', '),
            contactInfo: `Booking.com ID: ${hotelData.hotel_id}`,
            tripPlan: tripPlan,
            destination: destination,
          });
          await this.hotelRepository.save(hotelEntry);
        }

        const prices = hotelResult
          .map(
            (h) =>
              parseFloat(
                (h as { price_breakdown?: { all_inclusive_price: string } })
                  .price_breakdown?.all_inclusive_price as string,
              ) || 0,
          )
          .filter((p) => p > 0);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

        if (avgPrice > 600) {
          economicScore = 100;
          insights.push(
            this.createInsight(
              RiskLevel.MEDIUM,
              'economic_risk',
              `Note: Travel to ${destination?.name || 'destination'} is currently expensive. Average hotel: €${avgPrice.toFixed(0)}.`,
              tripPlan,
            ),
          );
        } else if (avgPrice < 120) {
          economicScore = -50;
          insights.push(
            this.createInsight(
              RiskLevel.LOW,
              'economic_opportunity',
              `Deal Alert: Exceptionally low hotel rates found in ${destination?.name || 'destination'}!`,
              tripPlan,
            ),
          );
        }
      }
      totalRiskScore += economicScore * 0.2;

      // 3. FINAL CONSOLIDATED RECOMMENDATION
      if (totalRiskScore > 70) {
        insights.push(
          this.createInsight(
            RiskLevel.HIGH,
            'intelligence_summary',
            `Intelligent Summary: Travel NOT recommended. Cumulative risk factors are high.`,
            tripPlan,
          ),
        );
      } else if (totalRiskScore < 20 && insights.length === 0) {
        insights.push(
          this.createInsight(
            RiskLevel.LOW,
            'intelligence_summary',
            `Intelligent Summary: Optimal travel conditions! Safe, clear, and affordable.`,
            tripPlan,
          ),
        );
      }

      const topHotels = await Promise.all(
        insights.map((i) => this.insightRepository.save(i)),
      );

      // Fetch saved hotels to return
      const savedHotels = await this.hotelRepository.find({
        where: { tripPlan: { id: tripPlanId } },
      });

      return { insights: topHotels, hotels: savedHotels };
    } catch (error) {
      this.logger.error(
        `Intelligence Algorithm Failure: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return { insights: [], hotels: [] };
    }
  }

  private createInsight(
    level: RiskLevel,
    type: string,
    msg: string,
    trip: TripPlan,
  ): IntelligenceInsight {
    return this.insightRepository.create({
      riskLevel: level,
      insightType: type,
      message: msg,
      timestamp: new Date(),
      tripPlan: trip,
    });
  }

  // CRUD for history
  findAll() {
    return this.insightRepository.find();
  }
  async create(dto: CreateIntelligenceDto) {
    const tp = await this.tripPlanRepository.findOneBy({ id: dto.tripPlanId });
    if (!tp) throw new NotFoundException('Trip plan not found');
    return this.insightRepository.save(
      this.insightRepository.create({ ...dto, tripPlan: tp }),
    );
  }
}
