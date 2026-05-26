import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { AirQualityApiPort, AirQualityReading } from '../../application/ports/air-quality-api.port';
import type { LatLon } from '../../../data-ingestion/domain/value-objects/lat-lon.vo';

@Injectable()
export class GoogleAirQualityAdapter implements AirQualityApiPort {
  private readonly logger = new Logger(GoogleAirQualityAdapter.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async current(coords: LatLon): Promise<AirQualityReading> {
    const apiKey = this.configService.get<string>('GOOGLE_AIR_QUALITY_API_KEY');
    if (!apiKey) {
      this.logger.warn('GOOGLE_AIR_QUALITY_API_KEY not set — returning stub AQI data.');
      return { aqi: 0, pm25: 0, pm10: 0 };
    }

    try {
      const url = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${apiKey}`;
      const body = { location: { latitude: coords.lat, longitude: coords.lon } };
      const { data } = await firstValueFrom(this.httpService.post(url, body));
      const indexes = data.indexes ?? [];
      const uaqi = indexes.find((i: any) => i.code === 'uaqi') ?? indexes[0];
      return {
        aqi: uaqi?.aqi ?? 0,
        pm25: data.pollutants?.find((p: any) => p.code === 'pm25')?.concentration?.value ?? 0,
        pm10: data.pollutants?.find((p: any) => p.code === 'pm10')?.concentration?.value ?? 0,
      };
    } catch (err: any) {
      this.logger.error(`Google Air Quality API error: ${err.message} — returning stub data.`);
      return { aqi: 0, pm25: 0, pm10: 0 };
    }
  }
}
