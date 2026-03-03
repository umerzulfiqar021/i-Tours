import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntelligenceInsight, RiskLevel } from '../../database/entities/IntelligenceInsight.entity';
import { TripPlan } from '../../database/entities/TripPlan.entity';
import { Hotel } from '../../database/entities/Hotel.entity';
import { GenerateIntelligenceDto } from './dto/generate-intelligence.dto';
import { ExternalDataService } from '../external-data/external-data.service';

/**
 * Service to manage intelligent insights for trip plans.
 */
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
   * Can be triggered by tripPlanId or by passing explicit coordinates/dates.
   */
  async generateIntelligentInsights(
    dto: GenerateIntelligenceDto,
  ): Promise<{ insights: IntelligenceInsight[]; hotels: Hotel[] }> {
    let tripPlan: TripPlan | null = null;
    let userId = dto.userId;
    let tripPlanId = dto.tripPlanId;

    if (tripPlanId && userId) {
      tripPlan = await this.tripPlanRepository.findOne({
        where: { id: tripPlanId, user: { id: userId } },
        relations: ['destination', 'user'],
      });
    } else if (tripPlanId) {
      tripPlan = await this.tripPlanRepository.findOne({
        where: { id: tripPlanId },
        relations: ['destination', 'user'],
      });
      if (tripPlan) {
        userId = tripPlan.user?.id;
      }
    }

    const lat = dto.latitude || tripPlan?.latitude?.toString();
    const lon = dto.longitude || tripPlan?.longitude?.toString();
    const startDate = dto.startDate || tripPlan?.startDate?.toISOString();
    const endDate = dto.endDate || tripPlan?.endDate?.toISOString();

    if (!lat || !lon) {
      this.logger.warn(`Missing coordinates for intelligence generation. Skipping.`);
      return { insights: [], hotels: [] };
    }

    const destination = tripPlan?.destination;
    const insights: IntelligenceInsight[] = [];

    try {
      const [weatherData, hotelData] = (await Promise.all([
        this.externalDataService.getWeather(lat, lon),
        this.externalDataService.getHotelsByCoordinates({
          latitude: lat,
          longitude: lon,
          arrival_date: (startDate || '').split('T')[0],
          departure_date: (endDate || '').split('T')[0],
        }),
      ])) as [any, any];

      let totalRiskScore = 0;
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
            if (tripPlan) {
              insights.push(
                this.createInsight(
                  RiskLevel.HIGH,
                  'weather_hazard',
                  `CRITICAL: Flash flood and storm warning for ${day.date || 'upcoming days'}.`,
                  tripPlan,
                ),
              );
            }
          } else if (rain > 15 || condition.includes('rain')) {
            weatherRisk = Math.max(weatherRisk, 40);
          }
        }
      }
      totalRiskScore += weatherRisk * 0.4;

      let roadRisk = 0;
      const mountainKeywords = ['Hunza', 'Skardu', 'Gilgit', 'Naran', 'Kalam', 'Murree'];
      const destName = destination?.name || '';
      const isMountainous = mountainKeywords.some((k) => destName.toLowerCase().includes(k.toLowerCase()));

      if (isMountainous && weatherRisk > 30) {
        roadRisk = 100;
        if (tripPlan) {
          insights.push(
            this.createInsight(
              RiskLevel.HIGH,
              'natural_hazard',
              `DANGER: Possible landslides in ${destName} due to rain in mountainous terrain.`,
              tripPlan,
            ),
          );
        }
      } else if (isMountainous) {
        roadRisk = 50;
      }
      totalRiskScore += roadRisk * 0.4;

      let economicScore = 0;
      const hotelResult = (hotelData as { result?: any[] })?.result;
      if (hotelResult && hotelResult.length > 0) {
        if (tripPlan) {
          const topHotels = hotelResult.slice(0, 5);
          for (const h of topHotels) {
            const hData = h as any;
            const hotelEntry = this.hotelRepository.create({
              name: hData.hotel_name || 'System Recommended Hotel',
              roomRent: parseFloat(hData.price_breakdown?.all_inclusive_price || '0') || 0,
              facilities: (hData.facilities || []).join(', '),
              contactInfo: `Booking.com ID: ${hData.hotel_id}`,
              tripPlan: tripPlan,
              destination: destination || undefined,
            });
            await this.hotelRepository.save(hotelEntry);
          }
        }

        const prices = hotelResult
          .map((h) => parseFloat((h as any).price_breakdown?.all_inclusive_price) || 0)
          .filter((p) => p > 0);
        const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

        if (avgPrice > 600) {
          economicScore = 100;
          if (tripPlan) {
            insights.push(
              this.createInsight(
                RiskLevel.MEDIUM,
                'economic_risk',
                `Note: Travel is currently expensive. Average hotel: €${avgPrice.toFixed(0)}.`,
                tripPlan,
              ),
            );
          }
        } else if (avgPrice > 0 && avgPrice < 120) {
          economicScore = -50;
          if (tripPlan) {
            insights.push(
              this.createInsight(
                RiskLevel.LOW,
                'economic_opportunity',
                `Deal Alert: Exceptionally low hotel rates found!`,
                tripPlan,
              ),
            );
          }
        }
      }
      totalRiskScore += economicScore * 0.2;

      if (totalRiskScore > 70) {
        if (tripPlan) {
          insights.push(
            this.createInsight(
              RiskLevel.HIGH,
              'intelligence_summary',
              `Intelligent Summary: Travel NOT recommended. Cumulative risk factors are high.`,
              tripPlan,
            ),
          );
        }
      } else if (totalRiskScore < 20 && insights.length === 0) {
        if (tripPlan) {
          insights.push(
            this.createInsight(
              RiskLevel.LOW,
              'intelligence_summary',
              `Intelligent Summary: Optimal travel conditions! Safe, clear, and affordable.`,
              tripPlan,
            ),
          );
        }
      }

      const savedInsights = tripPlan ? await Promise.all(insights.map((i) => this.insightRepository.save(i))) : insights;
      const savedHotels = tripPlanId ? await this.hotelRepository.find({ where: { tripPlan: { id: tripPlanId } } }) : [];

      return { insights: savedInsights, hotels: savedHotels };
    } catch (error) {
      this.logger.error(`Intelligence Algorithm Failure: ${error instanceof Error ? error.message : 'Unknown'}`);
      return { insights: [], hotels: [] };
    }
  }

  private createInsight(level: RiskLevel, type: string, msg: string, trip: TripPlan): IntelligenceInsight {
    return this.insightRepository.create({
      riskLevel: level,
      insightType: type,
      message: msg,
      timestamp: new Date(),
      tripPlan: trip,
    });
  }

  findAll() {
    return this.insightRepository.find();
  }

  async create(dto: GenerateIntelligenceDto) {
    if (!dto.tripPlanId) throw new NotFoundException('tripPlanId is required for intelligence persistence');
    const tp = await this.tripPlanRepository.findOneBy({ id: dto.tripPlanId });
    if (!tp) throw new NotFoundException('Trip plan not found');
    return this.insightRepository.save(
      this.insightRepository.create({
        insightType: dto.userLocation || 'manual',
        message: 'Manual Insight',
        riskLevel: RiskLevel.LOW,
        tripPlan: tp,
      }),
    );
  }
}
