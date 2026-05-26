import type { InverterSpec, PanelSpec } from '../../../shared/types/panel-spec';
import { IncompleteInverterSpecError, IncompletePanelSpecError } from '../errors/incomplete-spec.error';

type RawSpecs = Record<string, unknown>;
type AliasMap = Record<string, string>;

// Fuzzy lookup tables: canonical field → known aliases in the wild
const PANEL_ALIASES: Record<keyof PanelSpec, string[]> = {
  wattagePeakW: ['watts', 'wattage', 'peak_w', 'pmax', 'power_w', 'rated_power', 'watt_peak'],
  efficiencyPct: ['efficiency', 'eff', 'eff_pct', 'module_efficiency', 'eta'],
  areaSqM: ['area', 'area_m2', 'area_sqm', 'module_area', 'surface_m2'],
  voltageOpenCircuitV: ['voc', 'v_oc', 'open_circuit_voltage', 'voc_v'],
  currentShortCircuitA: ['isc', 'i_sc', 'short_circuit_current', 'isc_a'],
  warrantyYears: ['warranty', 'warranty_years', 'product_warranty'],
  temperatureCoefPctPerC: ['temp_coef', 'temperature_coefficient', 'pmax_temp_coef'],
};

const INVERTER_ALIASES: Record<keyof InverterSpec, string[]> = {
  nominalVoltageV: ['voltage', 'nominal_voltage', 'ac_voltage', 'output_voltage_v'],
  maxOutputCapacityW: ['capacity', 'power', 'rated_power', 'max_power', 'output_power_w', 'pac_max'],
  efficiencyPct: ['efficiency', 'eff', 'max_efficiency', 'euro_efficiency'],
  mpptInputs: ['mppt', 'mppt_inputs', 'num_mppt', 'mppt_channels'],
  phases: ['phases', 'phase', 'output_phases'],
};

function resolve(raw: RawSpecs, canonical: string, knownAliases: string[], explicitMap: AliasMap): unknown {
  // 1. Explicit mapping override
  const explicitKey = explicitMap[canonical];
  if (explicitKey && raw[explicitKey] !== undefined) return raw[explicitKey];

  // 2. Exact match on canonical name
  if (raw[canonical] !== undefined) return raw[canonical];

  // 3. Fuzzy match: check all known aliases
  for (const alias of knownAliases) {
    if (raw[alias] !== undefined) return raw[alias];
  }

  // 4. Case-insensitive scan of all raw keys
  const lowerCanonical = canonical.toLowerCase();
  for (const key of Object.keys(raw)) {
    if (key.toLowerCase() === lowerCanonical) return raw[key];
  }
  for (const alias of knownAliases) {
    for (const key of Object.keys(raw)) {
      if (key.toLowerCase() === alias.toLowerCase()) return raw[key];
    }
  }

  return undefined;
}

function num(v: unknown): number | undefined {
  if (v === undefined || v === null) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

export class SpecNormalizer {
  normalizePanel(raw: RawSpecs, tenantAliases: AliasMap = {}, requestMapping: AliasMap = {}): PanelSpec {
    const mapping: AliasMap = { ...tenantAliases, ...requestMapping };

    const wattagePeakW = num(resolve(raw, 'wattagePeakW', PANEL_ALIASES.wattagePeakW, mapping));
    const efficiencyPct = num(resolve(raw, 'efficiencyPct', PANEL_ALIASES.efficiencyPct, mapping));
    const areaSqM = num(resolve(raw, 'areaSqM', PANEL_ALIASES.areaSqM, mapping));

    const missing: string[] = [];
    if (wattagePeakW === undefined) missing.push('wattagePeakW');
    if (efficiencyPct === undefined) missing.push('efficiencyPct');
    if (areaSqM === undefined) missing.push('areaSqM');
    if (missing.length > 0) throw new IncompletePanelSpecError(missing);

    return {
      wattagePeakW: wattagePeakW!,
      efficiencyPct: efficiencyPct!,
      areaSqM: areaSqM!,
      voltageOpenCircuitV: num(resolve(raw, 'voltageOpenCircuitV', PANEL_ALIASES.voltageOpenCircuitV, mapping)),
      currentShortCircuitA: num(resolve(raw, 'currentShortCircuitA', PANEL_ALIASES.currentShortCircuitA, mapping)),
      warrantyYears: num(resolve(raw, 'warrantyYears', PANEL_ALIASES.warrantyYears, mapping)),
      temperatureCoefPctPerC: num(resolve(raw, 'temperatureCoefPctPerC', PANEL_ALIASES.temperatureCoefPctPerC, mapping)),
    };
  }

  normalizeInverter(raw: RawSpecs, tenantAliases: AliasMap = {}, requestMapping: AliasMap = {}): InverterSpec {
    const mapping: AliasMap = { ...tenantAliases, ...requestMapping };

    const nominalVoltageV = num(resolve(raw, 'nominalVoltageV', INVERTER_ALIASES.nominalVoltageV, mapping));
    const maxOutputCapacityW = num(resolve(raw, 'maxOutputCapacityW', INVERTER_ALIASES.maxOutputCapacityW, mapping));

    const missing: string[] = [];
    if (nominalVoltageV === undefined) missing.push('nominalVoltageV');
    if (maxOutputCapacityW === undefined) missing.push('maxOutputCapacityW');
    if (missing.length > 0) throw new IncompleteInverterSpecError(missing);

    const rawPhases = resolve(raw, 'phases', INVERTER_ALIASES.phases, mapping);
    const phases = rawPhases === 1 || rawPhases === 3 ? (rawPhases as 1 | 3) : undefined;

    return {
      nominalVoltageV: nominalVoltageV!,
      maxOutputCapacityW: maxOutputCapacityW!,
      efficiencyPct: num(resolve(raw, 'efficiencyPct', INVERTER_ALIASES.efficiencyPct, mapping)),
      mpptInputs: num(resolve(raw, 'mpptInputs', INVERTER_ALIASES.mpptInputs, mapping)),
      phases,
    };
  }
}
