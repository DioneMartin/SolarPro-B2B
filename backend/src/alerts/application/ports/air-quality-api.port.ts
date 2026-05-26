import type { LatLon } from '../../../data-ingestion/domain/value-objects/lat-lon.vo';

export interface AirQualityReading {
  aqi: number;
  pm25: number;
  pm10: number;
}

export interface AirQualityApiPort {
  current(coords: LatLon): Promise<AirQualityReading>;
}

export const AIR_QUALITY_API_PORT = 'AIR_QUALITY_API_PORT';
