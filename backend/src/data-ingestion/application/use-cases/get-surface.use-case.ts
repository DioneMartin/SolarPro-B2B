import { Injectable, Inject } from '@nestjs/common';
import { SurfaceRecord } from '../../domain/entities/surface-record.entity';
import { SURFACE_RECORD_REPOSITORY } from '../../domain/repositories/surface-record.repository';
import type { SurfaceRecordRepository } from '../../domain/repositories/surface-record.repository';

@Injectable()
export class GetSurfaceUseCase {
  constructor(
    @Inject(SURFACE_RECORD_REPOSITORY)
    private readonly repo: SurfaceRecordRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<SurfaceRecord> {
    const record = await this.repo.findById(id);
    if (!record || record.tenantId !== tenantId) {
      throw new Error('Surface record not found');
    }
    return record;
  }
}
