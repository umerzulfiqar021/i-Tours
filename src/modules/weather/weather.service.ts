import { Injectable, Logger } from '@nestjs/common';
import { RiskLevel } from '../../database/entities/Alert.entity';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  /**
   * Fetches real-time weather from RapidAPI.
   */
  async getRapidAPIWeather(location: string): Promise<{ alerts: any[]; current: any }> {
    try {
      const cityName = (location || '').split(',')[0].trim();
      const apiKey = process.env.X_RAPIDAPI_KEY;
      const host = process.env.X_RAPIDAPI_HOST || 'weatherapi-com.p.rapidapi.com';

      if (!apiKey) {
        this.logger.warn('RapidAPI key missing in environment variables.');
        return { alerts: [], current: null };
      }

      this.logger.log(`Fetching direct weather for: ${cityName}`);

      const response = await fetch(
        `https://${host}/alerts.json?q=${encodeURIComponent(cityName)}`,
        {
          method: 'GET',
          headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': host,
          },
        }
      );

      if (!response.ok) {
        this.logger.error(`RapidAPI Error: ${response.status} ${response.statusText}`);
        return { alerts: [], current: null };
      }

      const data = await response.json();
      return {
        alerts: data.alerts?.alert || [],
        current: data.current || null,
      };
    } catch (error) {
      this.logger.error(`Weather Service Failure: ${error.message}`);
      return { alerts: [], current: null };
    }
  }

  mapSeverityToRiskLevel(severity: string): RiskLevel {
    const s = (severity || '').toLowerCase();
    if (s.includes('severe') || s.includes('extreme') || s.includes('high')) return RiskLevel.HIGH;
    if (s.includes('moderate') || s.includes('medium')) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }
}
