import { Injectable, Inject } from '@nestjs/common';
import * as crypto from 'crypto';
import type { CalculationInput, CalculationOutput, RawProposal } from '../../../shared/types/calculation.types';
import type { Money } from '../../../shared/types/catalog-query.port';
import { CLOCK_PORT } from '../../application/ports/clock.port';
import type { ClockPort } from '../../application/ports/clock.port';
import { annualizeConsumption } from './consumption-aggregator';
import { sizePanels } from './panel-sizing';
import { inverterFits } from './inverter-matcher';
import { computeFinance } from './finance';
import { NoViableCombinationError } from '../errors/no-viable-combination.error';

@Injectable()
export class SolarCalculationEngine {
  constructor(
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
  ) {}

  calculate(input: CalculationInput): CalculationOutput {
    const {
      projectId,
      catalog,
      surface,
      parameters,
      consumption,
      consumptionSource,
    } = input;

    const annualConsumptionKwh = annualizeConsumption(consumption.months);
    const requiredAnnualKwh = annualConsumptionKwh * (parameters.energyDemandTargetPct / 100);

    const calculatedAt = this.clock.now().toISOString();

    const candidates: RawProposal[] = [];

    // Sort for deterministic output: panel.id then inverter.id
    const sortedPanels = [...catalog.panels].sort((a, b) => a.id.localeCompare(b.id));
    const sortedInverters = [...catalog.inverters].sort((a, b) => a.id.localeCompare(b.id));

    for (const panel of sortedPanels) {
      const sizing = sizePanels(
        panel.spec,
        surface.annualIrradiationKwhPerSqM,
        parameters.systemLossFactor,
        requiredAnnualKwh,
        surface.usableSqMeters,
      );

      const totalDcW = sizing.panelCount * panel.spec.wattagePeakW;

      for (const inverter of sortedInverters) {
        if (!inverterFits(inverter.spec, totalDcW)) {
          continue; // inverter too small — skip silently (not emitted per spec)
        }

        // Validate currency consistency before computing finance
        const currency = panel.unitCost.currency;
        const capexAmount = panel.unitCost.amount * sizing.panelCount + inverter.unitCost.amount;
        const capexTotal: Money = { amount: capexAmount, currency };

        // Default tariff if none provided (0-savings, shows only capex)
        const tariff = consumption.tariff ?? { currency, pricePerKwh: 0 };

        const finance = computeFinance({
          capexTotal,
          annualProductionKwh: sizing.annualProductionKwh,
          tariff,
          horizonYears: parameters.horizonYears,
          energyInflationPctPerYear: parameters.energyInflationPctPerYear,
          discountRatePct: parameters.discountRatePct,
        });

        const coveragePct = annualConsumptionKwh > 0
          ? (sizing.annualProductionKwh / annualConsumptionKwh) * 100
          : 0;

        const proposalId = crypto
          .createHash('sha256')
          .update(`${projectId}:${panel.id}:${inverter.id}`)
          .digest('hex')
          .slice(0, 16);

        const proposal: RawProposal = {
          id: proposalId,
          panel: {
            id: panel.id,
            brand: panel.brand,
            modelName: panel.modelName,
            spec: panel.spec,
            unitCost: panel.unitCost,
          },
          inverter: {
            id: inverter.id,
            brand: inverter.brand,
            modelName: inverter.modelName,
            spec: inverter.spec,
            unitCost: inverter.unitCost,
          },
          panelCount: sizing.panelCount,
          layout: {
            usedSqMeters: sizing.usedSqMeters,
            availableSqMeters: surface.usableSqMeters,
            fitsSurface: sizing.fitsSurface,
          },
          energy: {
            annualConsumptionKwh,
            annualProductionKwh: sizing.annualProductionKwh,
            coveragePct,
            targetMet: coveragePct >= parameters.energyDemandTargetPct,
          },
          finance: {
            capexTotal,
            annualSavings: finance.annualSavings,
            cumulativeSavings: finance.cumulativeSavings,
            paybackYear: finance.paybackYear,
            roi20YearPct: finance.roi20YearPct,
            npv: finance.npv,
          },
          provenance: {
            surfaceWasManualOverride: surface.wasManualOverride ?? false,
            consumptionSource,
            calculatedAt,
          },
        };

        candidates.push(proposal);
      }
    }

    if (candidates.length === 0) {
      throw new NoViableCombinationError(
        'No inverter in the catalog can handle any panel configuration.',
      );
    }

    return candidates;
  }
}
