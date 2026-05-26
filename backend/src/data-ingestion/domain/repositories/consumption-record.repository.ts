import { ConsumptionRecord } from '../entities/consumption-record.entity';

export const CONSUMPTION_RECORD_REPOSITORY = 'CONSUMPTION_RECORD_REPOSITORY';

export interface ConsumptionRecordRepository {
  save(record: ConsumptionRecord): Promise<void>;
  findById(id: string): Promise<ConsumptionRecord | null>;
  findByProjectId(projectId: string): Promise<ConsumptionRecord[]>;
}
