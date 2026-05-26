import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurfaceRecordOrmEntity } from '../persistence/surface-record.orm-entity';
import type { SurfaceReaderPort, SurfaceSnapshot } from '../../../shared/types/data-reader.ports';

@Injectable()
export class SurfaceReaderAdapter implements SurfaceReaderPort {
  constructor(
    @InjectRepository(SurfaceRecordOrmEntity)
    private readonly ormRepo: Repository<SurfaceRecordOrmEntity>,
  ) {}

  async findByProjectId(projectId: string, tenantId: string): Promise<SurfaceSnapshot | null> {
    const orm = await this.ormRepo.findOne({
      where: { projectId, tenantId },
      order: { updatedAt: 'DESC' },
    });
    if (!orm) return null;

    return {
      usableSqMeters: orm.estimatedUsableSqMeters,
      annualIrradiationKwhPerSqM: orm.annualIrradiationKwhPerSqM,
      wasManualOverride: orm.manualOverride,
    };
  }
}
