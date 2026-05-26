import type { PanelSpec } from '../../../shared/types/panel-spec';

export interface PanelSizingResult {
  panelCount: number;
  annualProductionKwh: number;
  usedSqMeters: number;
  fitsSurface: boolean;
}

/**
 * Calculates how many panels are needed to meet the required annual production.
 *
 * perPanelProduction = wattagePeakW × (irradiation / 1000) × systemLossFactor
 * The irradiation/1000 converts kWh/m²/yr at standard irradiance (1 kW/m²) to
 * a dimensionless "peak-sun-hours" multiplier for a W-rated panel.
 */
export function sizePanels(
  spec: PanelSpec,
  irradiationKwhPerSqM: number,
  systemLossFactor: number,
  requiredAnnualKwh: number,
  usableSqMeters: number,
): PanelSizingResult {
  const perPanelProductionKwh = spec.wattagePeakW * (irradiationKwhPerSqM / 1000) * systemLossFactor;

  const panelCount = Math.ceil(requiredAnnualKwh / perPanelProductionKwh);
  const annualProductionKwh = panelCount * perPanelProductionKwh;
  const usedSqMeters = panelCount * spec.areaSqM;
  const fitsSurface = usedSqMeters <= usableSqMeters;

  return { panelCount, annualProductionKwh, usedSqMeters, fitsSurface };
}
