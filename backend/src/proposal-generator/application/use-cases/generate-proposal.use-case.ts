import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DomainRuleError } from '../../../shared/errors';
import { v4 as uuidv4 } from 'uuid';
import { ProposalQueryFactory } from '../factories/proposal-query.factory';
import type { GenerateProposalInput } from '../factories/proposal-query.factory';
import { CriteriaPipeline } from '../../domain/criteria/criteria-pipeline';
import { CriteriaFitsSurface } from '../../domain/criteria/fits-surface.criterion';
import { Proposal } from '../../domain/entities/proposal.entity';
import { PROPOSAL_REPOSITORY } from '../../domain/repositories/proposal.repository';
import type { ProposalRepository } from '../../domain/repositories/proposal.repository';
import { CONSUMPTION_READER_PORT } from '../../../shared/types/data-reader.ports';
import type { ConsumptionReaderPort } from '../../../shared/types/data-reader.ports';
import { SURFACE_READER_PORT } from '../../../shared/types/data-reader.ports';
import type { SurfaceReaderPort } from '../../../shared/types/data-reader.ports';
import { CATALOG_QUERY_PORT } from '../../../shared/types/catalog-query.port';
import type { CatalogQueryPort } from '../../../shared/types/catalog-query.port';
import { CALCULATION_ENGINE_PORT } from '../../../solar-calculation/application/ports/calculation-engine.port';
import type { CalculationEnginePort } from '../../../solar-calculation/application/ports/calculation-engine.port';
import { EVENT_BUS } from '../../../shared/event-bus/event-bus.port';
import type { EventBus } from '../../../shared/event-bus/event-bus.port';
import { NoCandidatesError } from '../../domain/errors/no-candidates.error';

@Injectable()
export class GenerateProposalUseCase {
  constructor(
    private readonly factory: ProposalQueryFactory,
    @Inject(PROPOSAL_REPOSITORY)
    private readonly repo: ProposalRepository,
    @Inject(CONSUMPTION_READER_PORT)
    private readonly consumptionReader: ConsumptionReaderPort,
    @Inject(SURFACE_READER_PORT)
    private readonly surfaceReader: SurfaceReaderPort,
    @Inject(CATALOG_QUERY_PORT)
    private readonly catalogQuery: CatalogQueryPort,
    @Inject(CALCULATION_ENGINE_PORT)
    private readonly engine: CalculationEnginePort,
    @Inject(EVENT_BUS)
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: GenerateProposalInput & { tenantId: string; createdBy: string }): Promise<Proposal> {
    // 1. Load data from cross-module ports
    const consumption = await this.consumptionReader.findReadyByProjectId(input.projectId, input.tenantId);
    if (!consumption) {
      throw new NotFoundException('No ready consumption record found for this project.');
    }

    const surface = await this.surfaceReader.findByProjectId(input.projectId, input.tenantId);
    if (!surface) {
      throw new NotFoundException('No surface record found for this project.');
    }

    const [panels, inverters] = await Promise.all([
      this.catalogQuery.listActivePanels(input.tenantId),
      this.catalogQuery.listActiveInverters(input.tenantId),
    ]);

    if (panels.length === 0) {
      throw new DomainRuleError('El catálogo no tiene paneles activos. Agrega al menos un panel activo antes de generar propuestas.');
    }
    if (inverters.length === 0) {
      throw new DomainRuleError('El catálogo no tiene inversores activos. Agrega al menos un inversor activo antes de generar propuestas.');
    }

    // 2. Build query via Builder pattern
    const query = this.factory.fromInput(input);

    // 3. Build effective tariff (user-supplied rate overrides consumption's tariff)
    const effectiveTariff = consumption.tariff ??
      (input.pricePerKwh != null
        ? { currency: panels[0]?.unitCost.currency ?? 'MXN', pricePerKwh: input.pricePerKwh }
        : undefined);

    // 4. Run the calculation engine
    const candidates = this.engine.calculate({
      projectId: input.projectId,
      tenantId: input.tenantId,
      consumption: {
        months: consumption.months,
        tariff: effectiveTariff,
      },
      surface: {
        usableSqMeters: surface.usableSqMeters,
        annualIrradiationKwhPerSqM: surface.annualIrradiationKwhPerSqM,
        wasManualOverride: surface.wasManualOverride,
      },
      catalog: { panels, inverters },
      parameters: {
        energyDemandTargetPct: query.params.energyDemandTargetPct,
        horizonYears: query.params.horizonYears,
        energyInflationPctPerYear: query.params.energyInflationPctPerYear,
        systemLossFactor: query.params.systemLossFactor,
        discountRatePct: query.params.discountRatePct,
      },
      consumptionSource: consumption.source,
    });

    // 4. Apply brand whitelist pre-filter if specified
    let pool = candidates;
    if (query.brandWhitelist?.length) {
      const whitelist = query.brandWhitelist.map(b => b.toLowerCase());
      pool = pool.filter(p => whitelist.includes(p.panel.brand.toLowerCase()));
    }

    // 5. Apply Criteria pipeline (filter + rank)
    // Always include fitsSurface as a default safety filter unless overridden
    const hasSurfaceFilter = query.criteria.some(c => c instanceof CriteriaFitsSurface);
    const effectiveCriteria = hasSurfaceFilter ? [...query.criteria] : [new CriteriaFitsSurface(), ...query.criteria];

    const { filtered, optimal } = new CriteriaPipeline(effectiveCriteria).apply(pool);

    if (filtered.length === 0) {
      throw new NoCandidatesError();
    }

    // 6. Persist the proposal snapshot
    const proposal = Proposal.create({
      id: uuidv4(),
      tenantId: input.tenantId,
      projectId: input.projectId,
      query,
      rawCandidates: filtered,
      optimal,
      createdBy: input.createdBy,
    });

    await this.repo.save(proposal);

    // 7. Publish event
    await this.eventBus.publish('proposal.generated', {
      proposalId: proposal.id,
      tenantId: proposal.tenantId,
      projectId: proposal.projectId,
    });

    return proposal;
  }
}
