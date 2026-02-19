import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert, RiskLevel } from '../../database/entities/Alert.entity';
import { TripPlan } from '../../database/entities/TripPlan.entity';
import { CreateAlertDto } from './dto/create-alert.dto';
import { WeatherService } from '../weather/weather.service';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
    @InjectRepository(TripPlan)
    private readonly tripPlanRepository: Repository<TripPlan>,
    private readonly weatherService: WeatherService,
  ) {}

  /**
   * Generates real-time alerts for a specific trip plan.
   * Integrates weather data from RapidAPI and calculates route risks.
   * 
   * @param tripPlanId ID of the trip plan
   * @param userLocation Optional user's current city/location for road condition analysis
   * @returns List of generated alert entities
   */
  async generateAlertsForTripPlan(tripPlanId: number, userLocation?: string): Promise<Alert[]> {
    const tripPlan = await this.tripPlanRepository.findOne({
      where: { id: tripPlanId },
      relations: ['destination'],
    });

    if (!tripPlan) {
      throw new NotFoundException(`The trip plan (ID: ${tripPlanId}) could not be found.`);
    }
    
    const destination = tripPlan.destination;
    if (!destination) {
       this.logger.warn(`No destination linked to TripPlan ${tripPlanId}. Skipping alert generation.`);
       return [];
    }

    const alerts: Alert[] = [];
    const currentTime = new Date();

    try {
      // 1. Fetch Weather Alerts from RapidAPI
      const weatherAlerts = await this.checkRapidAPIWeatherConditions(destination.location);
      for (const weatherAlert of weatherAlerts) {
        const alert = this.alertRepository.create({
          riskLevel: weatherAlert.level,
          alertType: 'weather',
          message: weatherAlert.message,
          timestamp: currentTime,
          tripPlan: tripPlan,
        });
        alerts.push(await this.alertRepository.save(alert));
      }

      // 2. Analyze Road Conditions
      const roadAlerts = await this.checkRealRoadConditions(destination.location, userLocation);
      for (const roadAlert of roadAlerts) {
        const alert = this.alertRepository.create({
          riskLevel: roadAlert.level,
          alertType: 'road_conditions',
          message: roadAlert.message,
          timestamp: currentTime,
          tripPlan: tripPlan,
        });
        alerts.push(await this.alertRepository.save(alert));
      }

    } catch (error) {
      this.logger.error(`Critical error during alert generation for TripPlan ${tripPlanId}: ${error.message}`);
      
      const fallbackAlert = this.alertRepository.create({
        riskLevel: RiskLevel.LOW,
        alertType: 'system',
        message: 'The alert system is currently updating. Please manually verify weather and road conditions locally.',
        timestamp: currentTime,
        tripPlan: tripPlan,
      });
      alerts.push(await this.alertRepository.save(fallbackAlert));
    }

    return alerts;
  }

  /**
   * Fetches weather alerts using the RapidAPI Weather API via WeatherService.
   */
  async checkRapidAPIWeatherConditions(location: string): Promise<{ level: RiskLevel; message: string }[]> {
    const { alerts: apiAlerts, current } = await this.weatherService.getRapidAPIWeather(location);
    const alerts: { level: RiskLevel; message: string }[] = [];

    if (apiAlerts && apiAlerts.length > 0) {
      for (const apiAlert of apiAlerts) {
        alerts.push({
          level: this.weatherService.mapSeverityToRiskLevel(apiAlert.severity),
          message: `Weather Alert: ${apiAlert.headline || apiAlert.event}. ${apiAlert.desc || ''}`,
        });
      }
    }

    if (current) {
      const temp = current.temp_c;
      const wind = current.wind_kph;
      
      if (temp > 40) {
        alerts.push({ level: RiskLevel.HIGH, message: `Extreme heat warning: ${temp}°C. Stay hydrated and seek shade.` });
      } else if (temp < 0) {
        alerts.push({ level: RiskLevel.HIGH, message: `Freezing alert: ${temp}°C. Dangerous driving conditions possible.` });
      }

      if (wind > 50) {
        alerts.push({ level: RiskLevel.MEDIUM, message: `High wind speed: ${wind} km/h. Avoid high-profile vehicles.` });
      }
    }

    if (alerts.length === 0) {
      return this.getEnhancedWeatherAlerts(location);
    }

    return alerts;
  }


  /**
   * Fallback seasonal logic for when APIs are unavailable.
   */
  private getEnhancedWeatherAlerts(location: string): { level: RiskLevel; message: string }[] {
    const alerts: { level: RiskLevel; message: string }[] = [];
    const random = Math.random();
    const month = new Date().getMonth() + 1;
    
    if (location.includes('Pakistan')) {
      if (month >= 5 && month <= 9 && (location.includes('Sindh') || location.includes('Punjab'))) {
        if (random < 0.6) {
          alerts.push({
            level: RiskLevel.HIGH,
            message: 'Seasonal Alert: Peak summer heat wave expected. Temperatures may exceed 45°C.'
          });
        }
      }
      if ((month >= 12 || month <= 2) && location.includes('Gilgit-Baltistan')) {
        alerts.push({
          level: RiskLevel.HIGH,
          message: 'Winter Advisory: Snow and sub-zero temperatures likely. Northern passes may be restricted.'
        });
      }
    }

    return alerts;
  }

  /**
   * Analyzes road conditions based on distance and known terrain features.
   */
  async checkRealRoadConditions(destLocation: string, userLocation?: string): Promise<{ level: RiskLevel; message: string }[]> {
    const alerts: { level: RiskLevel; message: string }[] = [];
    
    if (userLocation) {
      const destCoords = await this.getCoordinates(destLocation);
      const userCoords = await this.getCoordinates(userLocation);

      if (destCoords && userCoords) {
        const distanceKm = this.calculateDistance(destCoords.lat, destCoords.lon, userCoords.lat, userCoords.lon);
        
        if (distanceKm > 300) {
           alerts.push({
             level: RiskLevel.MEDIUM,
             message: `Long-haul travel: approximately ${Math.round(distanceKm)}km distance. Plan for regular rest stops.`
           });
        }

        const mountainKeywords = ['Hunza', 'Skardu', 'Gilgit', 'Naran', 'Kalam', 'Murree', 'Galiyat'];
        if (mountainKeywords.some(k => destLocation.includes(k))) {
           alerts.push({
              level: RiskLevel.HIGH,
              message: 'Hazardous terrain: Journey involves high-altitude mountain roads. Ensure brakes are checked.'
           });
        }
      }
    }
    
    alerts.push(...this.getSmartRoadConditionAlerts(destLocation));
    return alerts;
  }

  private async getCoordinates(location: string): Promise<{lat: number, lon: number} | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`;
      const response = await fetch(url, { headers: { 'User-Agent': 'i-Tours-App/1.0' } });
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
      }
    } catch (e) {
      this.logger.error(`Geocoding failed for ${location}: ${e.message}`);
    }
    return null;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c;
  }

  private getSmartRoadConditionAlerts(location: string): { level: RiskLevel; message: string }[] {
    const alerts: { level: RiskLevel; message: string }[] = [];
    const hour = new Date().getHours();
    
    if (location.includes('Pakistan')) {
      if (location.includes('Lahore') || location.includes('Karachi') || location.includes('Islamabad')) {
        if ((hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20)) {
          alerts.push({
            level: RiskLevel.MEDIUM,
            message: 'Traffic Alert: Peak rush hour detected in major metropolitan area. Expect significant delays.'
          });
        }
      }
    }

    return alerts;
  }

  private extractCityFromLocation(location: string): string {
    return (location || '').split(',')[0].trim();
  }

  /**
   * Fetches existing alerts for a specific trip plan.
   */
  async getAlertsForTripPlan(tripPlanId: number): Promise<Alert[]> {
    return this.alertRepository.find({
      where: { tripPlan: { id: tripPlanId } },
      order: { timestamp: 'DESC' },
    });
  }

  async create(createAlertDto: CreateAlertDto): Promise<Alert> {
    const tripPlan = await this.tripPlanRepository.findOneBy({ id: createAlertDto.tripPlanId });
    if (!tripPlan) {
      throw new NotFoundException(`Trip plan (ID: ${createAlertDto.tripPlanId}) not found.`);
    }

    const alert = this.alertRepository.create({
      ...createAlertDto,
      tripPlan: tripPlan
    });
    return this.alertRepository.save(alert);
  }

  findAll(): Promise<Alert[]> {
    return this.alertRepository.find();
  }

  async findOne(id: number): Promise<Alert> {
    const alert = await this.alertRepository.findOneBy({ id });
    if (!alert) {
      throw new NotFoundException(`The requested alert (ID: ${id}) could not be found.`);
    }
    return alert;
  }
}
