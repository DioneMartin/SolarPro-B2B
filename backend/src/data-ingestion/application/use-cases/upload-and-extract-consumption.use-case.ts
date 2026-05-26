import { Injectable, Inject } from '@nestjs/common';
import { ConsumptionRecord } from '../../domain/entities/consumption-record.entity';
import { CONSUMPTION_RECORD_REPOSITORY } from '../../domain/repositories/consumption-record.repository';
import type { ConsumptionRecordRepository } from '../../domain/repositories/consumption-record.repository';
import { ConsumptionSource } from '../../domain/value-objects/consumption-source.enum';
import { ConsumptionStatus } from '../../domain/value-objects/consumption-status.enum';
import { BLOB_STORAGE_PORT } from '../ports/blob-storage.port';
import type { BlobStoragePort } from '../ports/blob-storage.port';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';

interface Input {
  tenantId: string;
  projectId: string;
  fileBuffer: Buffer;
  mimeType: string;
}

@Injectable()
export class UploadAndExtractConsumptionUseCase {
  constructor(
    @Inject(CONSUMPTION_RECORD_REPOSITORY)
    private readonly repo: ConsumptionRecordRepository,
    @Inject(BLOB_STORAGE_PORT)
    private readonly blobStorage: BlobStoragePort,
    @InjectQueue('ocr') private readonly ocrQueue: Queue,
  ) {}

  async execute(input: Input): Promise<ConsumptionRecord> {
    const source = input.mimeType.includes('pdf')
      ? ConsumptionSource.OCR_PDF
      : ConsumptionSource.OCR_IMAGE;

    const fileRef = await this.blobStorage.save(input.fileBuffer, input.mimeType);

    const record = ConsumptionRecord.create({
      id: uuidv4(),
      tenantId: input.tenantId,
      projectId: input.projectId,
      source,
      status: ConsumptionStatus.PENDING,
      rawFileRef: fileRef,
    });

    await this.repo.save(record);

    await this.ocrQueue.add('extract', {
      recordId: record.id,
      fileRef,
      mimeType: input.mimeType,
    });

    return record;
  }
}
