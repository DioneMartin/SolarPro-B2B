/** Cross-module read ports for the Proposal Generator to consume data from DataIngestionModule. */

export interface ConsumptionSnapshot {
  months: { year: number; month: number; kwh: number }[];
  source: 'MANUAL' | 'OCR_PDF' | 'OCR_IMAGE';
  tariff?: { currency: string; pricePerKwh: number; fixedFee?: number };
}

export interface SurfaceSnapshot {
  usableSqMeters: number;
  annualIrradiationKwhPerSqM: number;
  wasManualOverride: boolean;
}

export interface ConsumptionReaderPort {
  /** Returns the most-recent READY consumption record for a project, or null. */
  findReadyByProjectId(projectId: string, tenantId: string): Promise<ConsumptionSnapshot | null>;
}

export interface SurfaceReaderPort {
  /** Returns the surface record for a project, or null. */
  findByProjectId(projectId: string, tenantId: string): Promise<SurfaceSnapshot | null>;
}

export const CONSUMPTION_READER_PORT = 'CONSUMPTION_READER_PORT';
export const SURFACE_READER_PORT = 'SURFACE_READER_PORT';
