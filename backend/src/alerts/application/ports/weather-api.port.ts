import type { LatLon } from '../../../data-ingestion/domain/value-objects/lat-lon.vo';

export interface WeatherReading {
  windGustKmh: number;
  rainMmLast24h: number;
  snowForecastNext24h: boolean;
  tempCelsius: number;
}

export interface WeatherApiPort {
  current(coords: LatLon): Promise<WeatherReading>;
}

export const WEATHER_API_PORT = 'WEATHER_API_PORT';
