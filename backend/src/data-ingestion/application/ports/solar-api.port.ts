import { LatLon } from '../../domain/value-objects/lat-lon.vo';

export const SOLAR_API_PORT = 'SOLAR_API_PORT';

export interface SolarApiPort {
  buildingInsights(input: { address?: string; coords?: LatLon }): Promise<{
    coords: LatLon;
    annualIrradiationKwhPerSqM: number;
    estimatedUsableSqMeters: number;
    raw: unknown;
  }>;
}
