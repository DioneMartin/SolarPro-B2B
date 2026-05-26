import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';

import { ConsumptionRecordOrmEntity } from './persistence/consumption-record.orm-entity';
import { SurfaceRecordOrmEntity } from './persistence/surface-record.orm-entity';
import { SolarApiCacheOrmEntity } from './persistence/solar-api-cache.orm-entity';

import { ConsumptionController } from './http/consumption.controller';
import { SurfaceController } from './http/surface.controller';

import { RecordManualConsumptionUseCase } from '../application/use-cases/record-manual-consumption.use-case';
import { UploadAndExtractConsumptionUseCase } from '../application/use-cases/upload-and-extract-consumption.use-case';
import { UpdateConsumptionUseCase } from '../application/use-cases/update-consumption.use-case';
import { GetConsumptionUseCase } from '../application/use-cases/get-consumption.use-case';
import { LookupSurfaceUseCase } from '../application/use-cases/lookup-surface.use-case';
import { OverrideSurfaceUseCase } from '../application/use-cases/override-surface.use-case';
import { GetSurfaceUseCase } from '../application/use-cases/get-surface.use-case';

import { CONSUMPTION_RECORD_REPOSITORY } from '../domain/repositories/consumption-record.repository';
import { TypeOrmConsumptionRecordRepository } from './persistence/typeorm-consumption-record.repository';
import { SURFACE_RECORD_REPOSITORY } from '../domain/repositories/surface-record.repository';
import { TypeOrmSurfaceRecordRepository } from './persistence/typeorm-surface-record.repository';

import { OCR_PORT } from '../application/ports/ocr.port';
import { TesseractOcrAdapter } from './adapters/tesseract-ocr.adapter';
import { SOLAR_API_PORT } from '../application/ports/solar-api.port';
import { GoogleSolarApiAdapter } from './adapters/google-solar-api.adapter';
import { BLOB_STORAGE_PORT } from '../application/ports/blob-storage.port';
import { LocalFsBlobStorageAdapter } from './adapters/local-fs-blob-storage.adapter';

import { UtilityBillParser } from '../domain/services/utility-bill-parser';
import { OcrProcessor } from '../application/jobs/ocr.processor';

import { EventBusModule } from '../../shared/event-bus/event-bus.module';
import { ConsumptionReaderAdapter } from './adapters/consumption-reader.adapter';
import { SurfaceReaderAdapter } from './adapters/surface-reader.adapter';
import { CONSUMPTION_READER_PORT, SURFACE_READER_PORT } from '../../shared/types/data-reader.ports';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConsumptionRecordOrmEntity,
      SurfaceRecordOrmEntity,
      SolarApiCacheOrmEntity,
    ]),
    HttpModule,
    BullModule.registerQueue({
      name: 'ocr',
    }),
    EventBusModule,
  ],
  controllers: [ConsumptionController, SurfaceController],
  providers: [
    RecordManualConsumptionUseCase,
    UploadAndExtractConsumptionUseCase,
    UpdateConsumptionUseCase,
    GetConsumptionUseCase,
    LookupSurfaceUseCase,
    OverrideSurfaceUseCase,
    GetSurfaceUseCase,
    UtilityBillParser,
    OcrProcessor,
    { provide: CONSUMPTION_RECORD_REPOSITORY, useClass: TypeOrmConsumptionRecordRepository },
    { provide: SURFACE_RECORD_REPOSITORY, useClass: TypeOrmSurfaceRecordRepository },
    { provide: OCR_PORT, useClass: TesseractOcrAdapter },
    { provide: SOLAR_API_PORT, useClass: GoogleSolarApiAdapter },
    { provide: BLOB_STORAGE_PORT, useClass: LocalFsBlobStorageAdapter },
    // Cross-module read ports consumed by ProposalGeneratorModule
    ConsumptionReaderAdapter,
    { provide: CONSUMPTION_READER_PORT, useExisting: ConsumptionReaderAdapter },
    SurfaceReaderAdapter,
    { provide: SURFACE_READER_PORT, useExisting: SurfaceReaderAdapter },
  ],
  exports: [CONSUMPTION_READER_PORT, SURFACE_READER_PORT, BLOB_STORAGE_PORT],
})
export class DataIngestionModule {}
