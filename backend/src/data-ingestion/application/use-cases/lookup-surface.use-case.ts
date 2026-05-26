import { Injectable, Inject } from '@nestjs/common';
import { SurfaceRecord } from '../../domain/entities/surface-record.entity';
import { SURFACE_RECORD_REPOSITORY } from '../../domain/repositories/surface-record.repository';
import type { SurfaceRecordRepository } from '../../domain/repositories/surface-record.repository';
import { SOLAR_API_PORT } from '../ports/solar-api.port';
import type { SolarApiPort } from '../ports/solar-api.port';
import { LatLon } from '../../domain/value-objects/lat-lon.vo';
import { EVENT_BUS } from '../../../shared/event-bus/event-bus.port';
import type { EventBus } from '../../../shared/event-bus/event-bus.port';
import { v4 as uuidv4 } from 'uuid';

interface Input {
  tenantId: string;
  projectId: string;
  address?: string;
  coords?: { lat: number; lon: number };
}

@Injectable()
export class LookupSurfaceUseCase {
  constructor(
    @Inject(SURFACE_RECORD_REPOSITORY)
    private readonly repo: SurfaceRecordRepository,
    @Inject(SOLAR_API_PORT)
    private readonly solarApi: SolarApiPort,
    @Inject(EVENT_BUS)
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: Input): Promise<SurfaceRecord> {
    if (!input.address && !input.coords) {
      throw new Error('Address or coords must be provided');
    }

    const apiInput = {
      address: input.address,
      coords: input.coords ? LatLon.create(input.coords.lat, input.coords.lon) : undefined,
    };

    const apiResult = await this.solarApi.buildingInsights(apiInput);

    const record = SurfaceRecord.create({
      id: uuidv4(),
      tenantId: input.tenantId,
      projectId: input.projectId,
      inputAddress: input.address,
      coordinates: apiResult.coords,
      rawApiResponse: apiResult.raw,
      estimatedUsableSqMeters: apiResult.estimatedUsableSqMeters,
      annualIrradiationKwhPerSqM: apiResult.annualIrradiationKwhPerSqM,
    });

    await this.repo.save(record);

    await this.eventBus.publish('surface.updated', {
      recordId: record.id,
      projectId: record.projectId,
      tenantId: record.tenantId,
      usableSqMeters: record.estimatedUsableSqMeters,
      annualIrradiation: record.annualIrradiationKwhPerSqM,
    });

    return record;
  }
}
