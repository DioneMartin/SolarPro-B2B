import type { InverterSpec, PanelSpec } from './panel-spec';
import type { InverterCatalogItem, Money, PanelCatalogItem } from './catalog-query.port';

export interface CalculationInput {
  projectId: string;
  tenantId: string;
  consumption: {
    months: { year: number; month: number; kwh: number }[];
    tariff?: { currency: string; pricePerKwh: number; fixedFee?: number };
  };
  surface: {
    usableSqMeters: number;
    annualIrradiationKwhPerSqM: number;
    wasManualOverride?: boolean;
  };
  catalog: {
    panels: PanelCatalogItem[];
    inverters: InverterCatalogItem[];
  };
  parameters: {
    energyDemandTargetPct: number;      // 0-100
    horizonYears: number;               // default 20
    energyInflationPctPerYear: number;  // default 4
    systemLossFactor: number;           // default 0.85
    discountRatePct?: number;           // optional for NPV
  };
  consumptionSource: 'MANUAL' | 'OCR_PDF' | 'OCR_IMAGE';
}

export interface RawProposal {
  id: string;
  panel: { id: string; brand: string; modelName: string; spec: PanelSpec; unitCost: Money };
  inverter: { id: string; brand: string; modelName: string; spec: InverterSpec; unitCost: Money };
  panelCount: number;
  layout: { usedSqMeters: number; availableSqMeters: number; fitsSurface: boolean };
  energy: {
    annualConsumptionKwh: number;
    annualProductionKwh: number;
    coveragePct: number;
    targetMet: boolean;
  };
  finance: {
    capexTotal: Money;
    annualSavings: Money[];
    cumulativeSavings: Money[];
    paybackYear?: number;
    roi20YearPct: number;
    npv?: Money;
  };
  provenance: {
    surfaceWasManualOverride: boolean;
    consumptionSource: 'MANUAL' | 'OCR_PDF' | 'OCR_IMAGE';
    calculatedAt: string;
  };
}

export type CalculationOutput = RawProposal[];
