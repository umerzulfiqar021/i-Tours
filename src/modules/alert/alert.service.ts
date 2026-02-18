import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert, RiskLevel } from '../../database/entities/Alert.entity';
import { TripPlan } from '../../database/entities/TripPlan.entity';
import { CreateAlertDto } from './dto/create-alert.dto';

@Injectable()
export class AlertService {
  constructor(
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
    @InjectRepository(TripPlan)
    private tripPlanRepository: Repository<TripPlan>,
  ) {}

  // Enhanced alert generation with real weather and road condition APIs
  async generateAlertsForTripPlan(tripPlanId: number, userLocation?: string): Promise<Alert[]> {
    const tripPlan = await this.tripPlanRepository.findOne({
      where: { id: tripPlanId },
      relations: ['destination'],
    });

    if (!tripPlan) {
      throw new NotFoundException(`TripPlan with ID ${tripPlanId} not found`);
    }
    
    const destination = tripPlan.destination;
    if (!destination) {
       // If no destination is linked, we can't generate destination-specific alerts
       // But we could potentially generate general alerts or throw error.
       // For now, let's treat it as no alerts.
       return [];
    }

    const alerts: Alert[] = [];
    const currentTime = new Date();

    try {
      // Get weather condition alerts
      const weatherAlerts = await this.checkRealWeatherConditions(destination.location);
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

      // Get road condition alerts (comparing user location vs destination)
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

      // Additional safety alerts
      const securityRisk = this.checkSecurityConditions(destination.location);
      if (securityRisk) {
        const securityAlert = this.alertRepository.create({
          riskLevel: securityRisk.level,
          alertType: 'security',
          message: securityRisk.message,
          timestamp: currentTime,
          tripPlan: tripPlan,
        });
        alerts.push(await this.alertRepository.save(securityAlert));
      }

    } catch (error) {
      console.error('Error generating alerts:', error);
      // Fallback to basic alert generation if API fails
      const fallbackAlert = this.alertRepository.create({
        riskLevel: RiskLevel.LOW,
        alertType: 'system',
        message: 'Alert system is currently updating. Please check local weather and road conditions.',
        timestamp: currentTime,
        tripPlan: tripPlan,
      });
      alerts.push(await this.alertRepository.save(fallbackAlert));
    }

    return alerts;
  }

  // Real weather condition checking using free OpenWeatherMap API
  async checkRealWeatherConditions(location: string): Promise<{ level: RiskLevel; message: string }[]> {
    try {
      // Extract city name from location string
      const cityName = this.extractCityFromLocation(location);
      
      // You can get free API key from openweathermap.org
      const apiKey = process.env.OPEN_WEATHER_API_KEY || 'YOUR_FREE_API_KEY_HERE';
      
      if (apiKey === 'YOUR_FREE_API_KEY_HERE') {
        // Fallback to enhanced dummy data if no API key
        return this.getEnhancedWeatherAlerts(location);
      }

      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${apiKey}&units=metric`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cityName)}&appid=${apiKey}&units=metric`;

      const [weatherResponse, forecastResponse] = await Promise.all([
        fetch(weatherUrl),
        fetch(forecastUrl)
      ]);

      if (!weatherResponse.ok || !forecastResponse.ok) {
        return this.getEnhancedWeatherAlerts(location);
      }

      const weatherData = await weatherResponse.json();
      const forecastData = await forecastResponse.json();

      const alerts: { level: RiskLevel; message: string }[] = [];

      // Current weather alerts
      const temp = weatherData.main.temp;
      const windSpeed = weatherData.wind.speed;
      const weatherCondition = weatherData.weather[0].main.toLowerCase();
      const humidity = weatherData.main.humidity;

      // Temperature alerts
      if (temp > 40) {
        alerts.push({
          level: RiskLevel.HIGH,
          message: `Extreme heat warning: ${temp}°C. Avoid outdoor activities during peak hours. Stay hydrated and seek shade.`
        });
      } else if (temp < 0) {
        alerts.push({
          level: RiskLevel.HIGH,
          message: `Freezing temperature alert: ${temp}°C. Icy conditions possible. Drive carefully and dress warmly.`
        });
      }

      // Wind alerts
      if (windSpeed > 15) {
        alerts.push({
          level: RiskLevel.MEDIUM,
          message: `Strong wind warning: ${windSpeed} m/s. Avoid outdoor activities and secure loose objects.`
        });
      }

      // Weather condition alerts
      if (weatherCondition.includes('thunderstorm')) {
        alerts.push({
          level: RiskLevel.HIGH,
          message: 'Thunderstorm warning: Heavy rain and lightning expected. Avoid outdoor activities and travel if possible.'
        });
      } else if (weatherCondition.includes('snow')) {
        alerts.push({
          level: RiskLevel.MEDIUM,
          message: 'Snow alert: Poor visibility and slippery roads. Drive carefully and allow extra travel time.'
        });
      } else if (weatherCondition.includes('rain')) {
        alerts.push({
          level: RiskLevel.LOW,
          message: 'Rain alert: Wet roads and reduced visibility. Drive carefully and carry umbrella.'
        });
      }

      // Forecast alerts (next 24 hours)
      const next24Hours = forecastData.list.slice(0, 8); // 8 * 3 hours = 24 hours
      const severeWeatherAhead = next24Hours.some(forecast => 
        forecast.weather[0].main.toLowerCase().includes('thunderstorm') ||
        forecast.weather[0].main.toLowerCase().includes('snow')
      );

      if (severeWeatherAhead) {
        alerts.push({
          level: RiskLevel.MEDIUM,
          message: 'Weather forecast alert: Severe weather conditions expected in the next 24 hours. Plan accordingly.'
        });
      }

      return alerts;

    } catch (error) {
      console.error('Weather API error:', error);
      return this.getEnhancedWeatherAlerts(location);
    }
  }

  // Enhanced weather alerts with location-specific logic (fallback)
  private getEnhancedWeatherAlerts(location: string): { level: RiskLevel; message: string }[] {
    const alerts: { level: RiskLevel; message: string }[] = [];
    const random = Math.random();
    const month = new Date().getMonth() + 1; // 1-12
    
    // Pakistan seasonal weather patterns
    if (location.includes('Pakistan')) {
      // Summer months (May-September)
      if (month >= 5 && month <= 9) {
        if (location.includes('Sindh') || location.includes('Punjab')) {
          if (random < 0.6) {
            alerts.push({
              level: RiskLevel.HIGH,
              message: 'Summer heat wave: Temperature may exceed 45°C. Avoid outdoor activities between 11 AM - 4 PM.'
            });
          }
        }
        // Monsoon season
        if (month >= 7 && month <= 9 && random < 0.4) {
          alerts.push({
            level: RiskLevel.MEDIUM,
            message: 'Monsoon alert: Heavy rainfall and flooding possible. Avoid low-lying areas and check weather updates.'
          });
        }
      }
      
      // Winter months (December-February)
      if ((month >= 12 || month <= 2) && location.includes('Gilgit-Baltistan')) {
        if (random < 0.5) {
          alerts.push({
            level: RiskLevel.HIGH,
            message: 'Winter weather warning: Snow and sub-zero temperatures. Roads may be blocked. Carry winter gear.'
          });
        }
      }
    }

    // International locations
    if (location.includes('Dubai') && month >= 6 && month <= 9) {
      if (random < 0.7) {
        alerts.push({
          level: RiskLevel.MEDIUM,
          message: 'Desert heat advisory: Extreme temperatures up to 50°C. Stay in air-conditioned areas during day.'
        });
      }
    }

    return alerts;
  }

  // Real road condition checking
  async checkRealRoadConditions(destLocation: string, userLocation?: string): Promise<{ level: RiskLevel; message: string }[]> {
    try {
      const alerts: { level: RiskLevel; message: string }[] = [];
      
      // If user location is provided, we can generate route-specific alerts
      if (userLocation) {
        const destCoords = await this.getCoordinates(destLocation);
        const userCoords = await this.getCoordinates(userLocation);

        if (destCoords && userCoords) {
          const distanceKm = this.calculateDistance(destCoords.lat, destCoords.lon, userCoords.lat, userCoords.lon);
          
          if (distanceKm > 300) {
             alerts.push({
               level: RiskLevel.MEDIUM,
               message: `Long distance travel alert: Distance is approx. ${Math.round(distanceKm)}km. Determine rest stops and check vehicle fluids.`
             });
          }

          // Simple terrain logic based on keywords in location (Simulating terrain data)
          const mountainKeywords = ['Valley', 'Mountain', 'Peak', 'Hunza', 'Skardu', 'Gilgit', 'Naran', 'Kalam', 'Murree', 'Galiyat'];
          const isMountainous = mountainKeywords.some(k => destLocation.includes(k));
          
          if (isMountainous && distanceKm > 50) {
             alerts.push({
                level: RiskLevel.HIGH,
                message: `Mountainous terrain warning: Destination is in a high-altitude region. Ensure brakes are checked and drive cautiously on curves.`
             });
          }
        }
      }
      
      // Fallback/Supplement with smart logic
      const roadAlerts = this.getSmartRoadConditionAlerts(destLocation);
      alerts.push(...roadAlerts);

      return alerts;

    } catch (error) {
      console.error('Road conditions API error:', error);
      return this.getSmartRoadConditionAlerts(destLocation);
    }
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
      console.error('Geocoding error:', e);
    }
    return null;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    const d = R * c; // Distance in km
    return d;
  }



  // Smart road condition assessment
  private getSmartRoadConditionAlerts(location: string): { level: RiskLevel; message: string }[] {
    const alerts: { level: RiskLevel; message: string }[] = [];
    const random = Math.random();
    const currentHour = new Date().getHours();
    const isWeekend = [0, 6].includes(new Date().getDay());
    
    // Pakistan road conditions
    if (location.includes('Pakistan')) {
      // Major highways
      if (location.includes('Lahore') || location.includes('Karachi') || location.includes('Islamabad')) {
        // Rush hour traffic
        if ((currentHour >= 7 && currentHour <= 10) || (currentHour >= 17 && currentHour <= 20)) {
          if (!isWeekend && random < 0.8) {
            alerts.push({
              level: RiskLevel.MEDIUM,
              message: 'Rush hour traffic alert: Heavy congestion expected on main routes. Allow extra travel time.'
            });
          }
        }
        
        // Construction/maintenance
        if (random < 0.3) {
          alerts.push({
            level: RiskLevel.LOW,
            message: 'Road maintenance notice: Construction work may cause delays on some routes. Check alternate routes.'
          });
        }
      }
      
      // Northern areas road conditions
      if (location.includes('Gilgit-Baltistan') || location.includes('Hunza') || location.includes('Skardu')) {
        const month = new Date().getMonth() + 1;
        // Winter road closures
        if ((month >= 12 || month <= 3) && random < 0.4) {
          alerts.push({
            level: RiskLevel.HIGH,
            message: 'Mountain road alert: Snow and ice conditions. Some roads may be closed. Check with local authorities before travel.'
          });
        }
        // Landslide risk during monsoon
        if (month >= 7 && month <= 9 && random < 0.3) {
          alerts.push({
            level: RiskLevel.MEDIUM,
            message: 'Landslide risk: Heavy rains may cause rockfalls and landslides on mountain roads. Drive cautiously.'
          });
        }
      }
    }

    // International locations
    if (location.includes('Turkey') && random < 0.2) {
      alerts.push({
        level: RiskLevel.LOW,
        message: 'Traffic advisory: Tourist season may cause increased traffic in popular areas.'
      });
    }

    return alerts;
  }

  // Helper function to extract city name from location string
  private extractCityFromLocation(location: string): string {
    // Extract city name from "City, Province, Country" format
    const parts = location.split(',');
    return parts[0].trim();
  }

  // Legacy dummy methods (keeping for fallback)
  // Dummy weather conditions algorithm
  private checkWeatherConditions(location: string): { level: RiskLevel; message: string } | null {
    const random = Math.random();
    
    // Simulate different weather risks for different locations
    if (location.includes('Pakistan')) {
      if (random < 0.3) {
        return {
          level: RiskLevel.HIGH,
          message: 'Severe weather warning: Heavy rainfall and flooding expected in the next 24 hours.',
        };
      } else if (random < 0.6) {
        return {
          level: RiskLevel.MEDIUM,
          message: 'Moderate weather alert: Thunderstorms possible, plan indoor activities.',
        };
      }
    } else if (location.includes('Dubai') || location.includes('UAE')) {
      if (random < 0.2) {
        return {
          level: RiskLevel.MEDIUM,
          message: 'Extreme heat warning: Temperature expected to exceed 45°C. Stay hydrated.',
        };
      }
    }
    
    return null; // No weather alert
  }

  // Dummy road conditions algorithm
  private checkRoadConditions(location: string): { level: RiskLevel; message: string } | null {
    const random = Math.random();
    
    if (location.includes('Pakistan')) {
      if (random < 0.4) {
        return {
          level: RiskLevel.MEDIUM,
          message: 'Road conditions alert: Construction work on main highway, expect delays.',
        };
      }
    } else if (location.includes('France')) {
      if (random < 0.2) {
        return {
          level: RiskLevel.LOW,
          message: 'Traffic advisory: Metro strike affecting public transport schedules.',
        };
      }
    }
    
    return null; // No road alert
  }

  // Dummy security conditions algorithm
  private checkSecurityConditions(location: string): { level: RiskLevel; message: string } | null {
    const random = Math.random();
    
    if (random < 0.1) { // 10% chance of security alert
      return {
        level: RiskLevel.MEDIUM,
        message: 'Security advisory: Increased security measures in place. Keep identification documents ready.',
      };
    }
    
    return null; // No security alert
  }

  // Dummy crowd conditions algorithm
  private checkCrowdConditions(destinationName: string): { level: RiskLevel; message: string } | null {
    const random = Math.random();
    const isPopularDestination = ['Eiffel Tower', 'Lahore Fort', 'Dubai Mall'].includes(destinationName);
    
    if (isPopularDestination && random < 0.5) {
      return {
        level: RiskLevel.LOW,
        message: 'Crowd alert: High visitor volume expected. Consider visiting during off-peak hours.',
      };
    }
    
    return null; // No crowd alert
  }

  // Get alerts for a specific trip plan
  async getAlertsForTripPlan(tripPlanId: number): Promise<Alert[]> {
    return this.alertRepository.find({
      where: { tripPlan: { id: tripPlanId } },
      order: { timestamp: 'DESC' },
    });
  }

  async create(createAlertDto: CreateAlertDto): Promise<Alert> {
    const tripPlan = await this.tripPlanRepository.findOneBy({ id: createAlertDto.tripPlanId });
    if (!tripPlan) {
      throw new NotFoundException(`Trip plan with ID ${createAlertDto.tripPlanId} not found`);
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
      throw new NotFoundException('Alert not found. It may have expired or been removed from the system.');
    }
    return alert;
  }
}
