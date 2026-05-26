import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject } from '@nestjs/common';
import { CONSUMPTION_RECORD_REPOSITORY } from '../../domain/repositories/consumption-record.repository';
import type { ConsumptionRecordRepository } from '../../domain/repositories/consumption-record.repository';
import { OCR_PORT } from '../ports/ocr.port';
import type { OcrPort } from '../ports/ocr.port';
import { UtilityBillParser } from '../../domain/services/utility-bill-parser';
import { EVENT_BUS } from '../../../shared/event-bus/event-bus.port';
import type { EventBus } from '../../../shared/event-bus/event-bus.port';

@Processor('ocr')
export class OcrProcessor extends WorkerHost {
  constructor(
    @Inject(CONSUMPTION_RECORD_REPOSITORY)
    private readonly repo: ConsumptionRecordRepository,
    @Inject(OCR_PORT)
    private readonly ocrPort: OcrPort,
    @Inject(EVENT_BUS)
    private readonly eventBus: EventBus,
    private readonly parser: UtilityBillParser,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { recordId, fileRef, mimeType } = job.data;
    
    const record = await this.repo.findById(recordId);
    if (!record) {
      throw new Error('Record not found');
    }

    try {
      const text = await this.ocrPort.extract(fileRef, mimeType);
      const months = this.parser.parse(text);
      
      record.updateMonths(months);
      
      if (record.isValidForCalculation()) {
        record.markAsReady();
      } else {
        // If it extracted some months but not enough, we leave it PENDING or mark FAILED
        // Let's mark as FAILED so user knows they have to review/fix it.
        record.markAsFailed();
      }

      await this.repo.save(record);

      await this.eventBus.publish('consumption.updated', {
        recordId: record.id,
        projectId: record.projectId,
        tenantId: record.tenantId,
        months: record.months,
      });

    } catch (e) {
      record.markAsFailed();
      await this.repo.save(record);
      throw e;
    }
  }
}
