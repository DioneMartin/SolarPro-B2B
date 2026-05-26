export interface PanelSpec {
  wattagePeakW: number;
  efficiencyPct: number;
  areaSqM: number;
  voltageOpenCircuitV?: number;
  currentShortCircuitA?: number;
  warrantyYears?: number;
  temperatureCoefPctPerC?: number;
}

export interface InverterSpec {
  nominalVoltageV: number;
  maxOutputCapacityW: number;
  efficiencyPct?: number;
  mpptInputs?: number;
  phases?: 1 | 3;
}
