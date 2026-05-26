import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { WeatherApiPort, WeatherReading } from '../../application/ports/weather-api.port';
import type { LatLon } from '../../../data-ingestion/domain/value-objects/lat-lon.vo';

@Injectable()
export class OpenWeatherAdapter implements WeatherApiPort {
  private readonly logger = new Logger(OpenWeatherAdapter.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async current(coords: LatLon): Promise<WeatherReading> {
    const apiKey = this.configService.get<string>('OPENWEATHER_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENWEATHER_API_KEY not set — returning stub weather data.');
      return { windGustKmh: 0, rainMmLast24h: 0, snowForecastNext24h: false, tempCelsius: 20 };
    }

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric`;
      const { data } = await firstValueFrom(this.httpService.get(url));
      return {
        windGustKmh: (data.wind?.gust ?? 0) * 3.6,
        rainMmLast24h: data.rain?.['1h'] ?? 0,
        snowForecastNext24h: data.weather?.some((w: any) => w.main === 'Snow') ?? false,
        tempCelsius: data.main?.temp ?? 20,
      };
    } catch (err: any) {
      this.logger.error(`OpenWeather API error: ${err.message} — returning stub data.`);
      return { windGustKmh: 0, rainMmLast24h: 0, snowForecastNext24h: false, tempCelsius: 20 };
    }
  }
}
