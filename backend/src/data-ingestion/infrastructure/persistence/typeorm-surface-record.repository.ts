import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurfaceRecordOrmEntity } from './surface-record.orm-entity';
import { SurfaceRecord } from '../../domain/entities/surface-record.entity';
import { SurfaceRecordRepository } from '../../domain/repositories/surface-record.repository';
import { LatLon } from '../../domain/value-objects/lat-lon.vo';

@Injectable()
export class TypeOrmSurfaceRecordRepository implements SurfaceRecordRepository {
  constructor(
    @InjectRepository(SurfaceRecordOrmEntity)
    private readonly ormRepo: Repository<SurfaceRecordOrmEntity>,
  ) {}

  private toDomain(orm: SurfaceRecordOrmEntity): SurfaceRecord {
    return SurfaceRecord.rehydrate({
      id: orm.id,
      tenantId: orm.tenantId,
      projectId: orm.projectId,
      inputAddress: orm.inputAddress ?? undefined,
      coordinates: LatLon.rehydrate(orm.coordinates.lat, orm.coordinates.lon),
      rawApiResponse: orm.rawApiResponse,
      estimatedUsableSqMeters: orm.estimatedUsableSqMeters,
      annualIrradiationKwhPerSqM: orm.annualIrradiationKwhPerSqM,
      manualOverride: orm.manualOverride,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  private toOrm(domain: SurfaceRecord): SurfaceRecordOrmEntity {
    const orm = new SurfaceRecordOrmEntity();
    orm.id = domain.id;
    orm.tenantId = domain.tenantId;
    orm.projectId = domain.projectId;
    orm.inputAddress = domain.inputAddress ?? null;
    orm.coordinates = { lat: domain.coordinates.lat, lon: domain.coordinates.lon };
    orm.rawApiResponse = domain.rawApiResponse;
    orm.estimatedUsableSqMeters = domain.estimatedUsableSqMeters;
    orm.annualIrradiationKwhPerSqM = domain.annualIrradiationKwhPerSqM;
    orm.manualOverride = domain.manualOverride;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }

  async save(record: SurfaceRecord): Promise<void> {
    const orm = this.toOrm(record);
    await this.ormRepo.save(orm);
  }

  async findById(id: string): Promise<SurfaceRecord | null> {
    const orm = await this.ormRepo.findOne({ where: { id } });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  async findByProjectId(projectId: string): Promise<SurfaceRecord | null> {
    const orm = await this.ormRepo.findOne({ where: { projectId } });
    if (!orm) return null;
    return this.toDomain(orm);
  }
}
