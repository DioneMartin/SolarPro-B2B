import { SurfaceRecord } from '../entities/surface-record.entity';

export const SURFACE_RECORD_REPOSITORY = 'SURFACE_RECORD_REPOSITORY';

export interface SurfaceRecordRepository {
  save(record: SurfaceRecord): Promise<void>;
  findById(id: string): Promise<SurfaceRecord | null>;
  findByProjectId(projectId: string): Promise<SurfaceRecord | null>;
}
