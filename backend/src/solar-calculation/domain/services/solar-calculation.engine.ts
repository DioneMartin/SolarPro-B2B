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
      // Diagnose why no combination was viable for a user-friendly message
      const maxInverterW = sortedInverters.length > 0
        ? Math.max(...sortedInverters.map(i => i.spec.maxOutputCapacityW))
        : 0;
      const minSystemDcW = sortedPanels.length > 0
        ? Math.min(...sortedPanels.map(panel => {
            const sz = sizePanels(
              panel.spec,
              surface.annualIrradiationKwhPerSqM,
              parameters.systemLossFactor,
              requiredAnnualKwh,
              surface.usableSqMeters,
            );
            return sz.panelCount * panel.spec.wattagePeakW;
          }))
        : 0;

      const maxAllowedW = maxInverterW * 1.2;
      if (minSystemDcW > maxAllowedW) {
        const minKw = (minSystemDcW / 1000).toFixed(1);
        const maxKw = (maxAllowedW / 1000).toFixed(1);
        throw new NoViableCombinationError(
          `La configuración mínima requiere ${minKw} kW CC, ` +
          `pero el inversor más grande del catálogo solo admite ${maxKw} kW (capacidad × 1.2). ` +
          `Agrega al catálogo un inversor con mayor capacidad de salida.`,
        );
      }

      throw new NoViableCombinationError(
        'Ningún inversor del catálogo es compatible con la configuración de paneles necesaria. ' +
        'Verifica que los inversores del catálogo tengan la capacidad de salida adecuada.',
      );
    }

    return candidates;
  }
}
