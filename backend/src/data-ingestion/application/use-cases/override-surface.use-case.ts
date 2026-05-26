import { Injectable, Inject } from '@nestjs/common';
import { SurfaceRecord } from '../../domain/entities/surface-record.entity';
import { SURFACE_RECORD_REPOSITORY } from '../../domain/repositories/surface-record.repository';
import type { SurfaceRecordRepository } from '../../domain/repositories/surface-record.repository';
import { EVENT_BUS } from '../../../shared/event-bus/event-bus.port';
import type { EventBus } from '../../../shared/event-bus/event-bus.port';

interface Input {
  id: string;
  tenantId: string;
  usableSqMeters: number;
}

@Injectable()
export class OverrideSurfaceUseCase {
  constructor(
    @Inject(SURFACE_RECORD_REPOSITORY)
    private readonly repo: SurfaceRecordRepository,
    @Inject(EVENT_BUS)
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: Input): Promise<SurfaceRecord> {
    const record = await this.repo.findById(input.id);
    if (!record || record.tenantId !== input.tenantId) {
      throw new Error('Surface record not found');
    }

    record.overrideUsableArea(input.usableSqMeters);

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
