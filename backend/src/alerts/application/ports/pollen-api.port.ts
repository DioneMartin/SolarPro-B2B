import type { LatLon } from '../../../data-ingestion/domain/value-objects/lat-lon.vo';

export interface PollenReading {
  index: number;
  dominantTaxon: string;
}

export interface PollenApiPort {
  current(coords: LatLon): Promise<PollenReading>;
}

export const POLLEN_API_PORT = 'POLLEN_API_PORT';
