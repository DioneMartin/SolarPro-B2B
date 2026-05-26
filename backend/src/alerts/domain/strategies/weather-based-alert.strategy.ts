import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AlertEvent, type AlertSeverity } from '../entities/alert-event.entity';
import type { AlertPolicy, WeatherBasedConfig } from '../entities/alert-policy.entity';
import type { AlertStrategy, EvaluationContext } from './alert-strategy';
import { WEATHER_API_PORT } from '../../application/ports/weather-api.port';
import type { WeatherApiPort } from '../../application/ports/weather-api.port';
import { AIR_QUALITY_API_PORT } from '../../application/ports/air-quality-api.port';
import type { AirQualityApiPort } from '../../application/ports/air-quality-api.port';
import { POLLEN_API_PORT } from '../../application/ports/pollen-api.port';
import type { PollenApiPort } from '../../application/ports/pollen-api.port';
import type { LatLon } from '../../../data-ingestion/domain/value-objects/lat-lon.vo';

@Injectable()
export class WeatherBasedAlertStrategy implements AlertStrategy {
  readonly kind = 'WEATHER_BASED' as const;

  constructor(
    @Inject(WEATHER_API_PORT)
    private readonly weatherApi: WeatherApiPort,
    @Inject(AIR_QUALITY_API_PORT)
    private readonly airQualityApi: AirQualityApiPort,
    @Inject(POLLEN_API_PORT)
    private readonly pollenApi: PollenApiPort,
  ) {}

  async evaluate(policy: AlertPolicy, ctx: EvaluationContext): Promise<AlertEvent[]> {
    const config = policy.config as WeatherBasedConfig;
    const coords = config.coords as unknown as LatLon;
    const { thresholds } = config;
    const results: AlertEvent[] = [];

    const [weather, airQuality, pollen] = await Promise.all([
      this.weatherApi.current(coords),
      this.airQualityApi.current(coords),
      this.pollenApi.current(coords),
    ]);

    const emit = (title: string, body: string, severity: AlertSeverity, payload: Record<string, unknown>) => {
      results.push(
        AlertEvent.create({
          id: uuidv4(),
          tenantId: policy.tenantId,
          policyId: policy.id,
          projectId: policy.projectId,
          severity,
          title,
          body,
          payload,
          triggeredAt: ctx.now,
        }),
      );
    };

    if (thresholds.windGustKmhAbove !== undefined && weather.windGustKmh > thresholds.windGustKmhAbove) {
      emit(
        'High wind gust detected',
        `Wind gusts of ${weather.windGustKmh} km/h exceed threshold of ${thresholds.windGustKmhAbove} km/h. Check panel fixings.`,
        'WARNING',
        { windGustKmh: weather.windGustKmh },
      );
    }

    if (thresholds.rainMmInDayAbove !== undefined && weather.rainMmLast24h > thresholds.rainMmInDayAbove) {
      emit(
        'Heavy rain — post-rain inspection recommended',
        `${weather.rainMmLast24h} mm of rain in the last 24 hours (threshold: ${thresholds.rainMmInDayAbove} mm).`,
        'INFO',
        { rainMmLast24h: weather.rainMmLast24h },
      );
    }

    if (thresholds.snowExpected && weather.snowForecastNext24h) {
      emit(
        'Snow forecast — panel shading risk',
        'Snow is forecast in the next 24 hours. Manual clearing may be required.',
        'WARNING',
        { snowForecastNext24h: true },
      );
    }

    if (thresholds.aqiAbove !== undefined && airQuality.aqi > thresholds.aqiAbove) {
      emit(
        'Poor air quality — panel soiling risk',
        `AQI ${airQuality.aqi} exceeds threshold ${thresholds.aqiAbove}. Consider scheduling a panel cleaning.`,
        'WARNING',
        { aqi: airQuality.aqi, pm25: airQuality.pm25 },
      );
    }

    if (thresholds.pollenAbove !== undefined && pollen.index > thresholds.pollenAbove) {
      emit(
        'High pollen index — panel soiling risk',
        `Pollen index ${pollen.index} (${pollen.dominantTaxon}) exceeds threshold ${thresholds.pollenAbove}.`,
        'INFO',
        { pollenIndex: pollen.index, dominantTaxon: pollen.dominantTaxon },
      );
    }

    return results;
  }
}
