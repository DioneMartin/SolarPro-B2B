import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { PollenApiPort, PollenReading } from '../../application/ports/pollen-api.port';
import type { LatLon } from '../../../data-ingestion/domain/value-objects/lat-lon.vo';

@Injectable()
export class GooglePollenAdapter implements PollenApiPort {
  private readonly logger = new Logger(GooglePollenAdapter.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async current(coords: LatLon): Promise<PollenReading> {
    const apiKey = this.configService.get<string>('GOOGLE_POLLEN_API_KEY');
    if (!apiKey) {
      this.logger.warn('GOOGLE_POLLEN_API_KEY not set — returning stub pollen data.');
      return { index: 0, dominantTaxon: 'unknown' };
    }

    try {
      const url = `https://pollen.googleapis.com/v1/forecast:lookup?key=${apiKey}&location.longitude=${coords.lon}&location.latitude=${coords.lat}&days=1`;
      const { data } = await firstValueFrom(this.httpService.get(url));
      const dayInfo = data.dailyInfo?.[0];
      const dominant = dayInfo?.plantInfo?.reduce((max: any, p: any) =>
        (p.indexInfo?.value ?? 0) > (max?.indexInfo?.value ?? 0) ? p : max, null);
      return {
        index: dominant?.indexInfo?.value ?? 0,
        dominantTaxon: dominant?.displayName ?? 'unknown',
      };
    } catch (err: any) {
      this.logger.error(`Google Pollen API error: ${err.message} — returning stub data.`);
      return { index: 0, dominantTaxon: 'unknown' };
    }
  }
}
