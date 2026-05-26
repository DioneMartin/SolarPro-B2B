import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolarApiPort } from '../../application/ports/solar-api.port';
import { LatLon } from '../../domain/value-objects/lat-lon.vo';
import { SolarApiCacheOrmEntity } from '../persistence/solar-api-cache.orm-entity';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class GoogleSolarApiAdapter implements SolarApiPort {
  private readonly logger = new Logger(GoogleSolarApiAdapter.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(SolarApiCacheOrmEntity)
    private readonly cacheRepo: Repository<SolarApiCacheOrmEntity>,
  ) {}

  async buildingInsights(input: { address?: string; coords?: LatLon }): Promise<{
    coords: LatLon;
    annualIrradiationKwhPerSqM: number;
    estimatedUsableSqMeters: number;
    raw: unknown;
  }> {
    const apiKey = this.configService.get<string>('GOOGLE_SOLAR_API_KEY');
    if (!apiKey) {
      this.logger.warn('GOOGLE_SOLAR_API_KEY not set. Using dummy data.');
      return this.getDummyData(input.coords);
    }

    let locationParam = '';
    let hashInput = '';
    if (input.coords) {
      locationParam = `location.latitude=${input.coords.lat}&location.longitude=${input.coords.lon}`;
      hashInput = `${input.coords.lat},${input.coords.lon}`;
    } else if (input.address) {
      hashInput = input.address;
      this.logger.warn('Google Solar API requires coordinates. Using dummy data for address only query.');
      return this.getDummyData(input.coords);
    }

    const hash = crypto.createHash('sha256').update(hashInput).digest('hex');
    const cached = await this.cacheRepo.findOne({ where: { addressHash: hash } });

    if (cached) {
      this.logger.log(`Cache hit for ${hashInput}`);
      return this.parseResponse(cached.response);
    }

    try {
      const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?${locationParam}&requiredQuality=HIGH&key=${apiKey}`;
      const { data } = await firstValueFrom(this.httpService.get(url));

      const cacheEntry = new SolarApiCacheOrmEntity();
      cacheEntry.addressHash = hash;
      cacheEntry.response = data;
      cacheEntry.fetchedAt = new Date();
      await this.cacheRepo.save(cacheEntry);

      return this.parseResponse(data);
    } catch (e: any) {
      this.logger.error(`Error calling Solar API: ${e.message}`);
      throw new Error('Failed to fetch from Google Solar API');
    }
  }

  private parseResponse(data: any) {
    const lat = data.center?.latitude || 0;
    const lon = data.center?.longitude || 0;
    const solarPotential = data.solarPotential || {};
    return {
      coords: LatLon.create(lat, lon),
      annualIrradiationKwhPerSqM: solarPotential.maxSunshineHoursPerYear || 1500,
      estimatedUsableSqMeters: solarPotential.wholeRoofStats?.areaMeters2 || 50,
      raw: data,
    };
  }

  private getDummyData(coords?: LatLon) {
    return {
      coords: coords || LatLon.create(19.4326, -99.1332),
      annualIrradiationKwhPerSqM: 1800,
      estimatedUsableSqMeters: 120,
      raw: { dummy: true },
    };
  }
}
