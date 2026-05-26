# 06 — Proposal Generator Service

> The user-facing wrapper around the calculation engine. Implements the two patterns specified in the brief: **Builder** for the query and **Criteria/Filter** for picking the optimal candidate.

Folder: `backend/src/proposal-generator/`

---

## What the user asked for (verbatim)

> *Builder Pattern: Used to dynamically construct the Request or Query payload. Avoids the Telescoping Constructor anti-pattern and provides a clean fluent interface for the Consultant to set parameters.*
>
> *Criteria / Filter Pattern: Used to encapsulate filtering business rules (e.g., CriteriaLowestROI, CriteriaBrand). Evaluates the raw output array through combinable logical operations (AND/OR) without hardcoded if/else chains.*
>
> *Execution Pipeline:*
> 1. *Consultant configures parameters via Builder → Outputs ProposalQuery.*
> 2. *ProposalQuery is injected into Solar Calculation Engine → Outputs array of Raw Proposals.*
> 3. *Criteria Pattern rules are applied to Raw Proposals → Outputs the Optimal Proposal (or filtered set).*

> *Rejected Approach: Strategy Pattern. (Not applicable; the system does not require runtime algorithm switching, but object construction and result filtering).*

The plan below is a literal implementation of that brief.

---

## Pattern 1 — Builder (for `ProposalQuery`)

### Shape

```ts
// domain/builders/proposal-query.builder.ts

export class ProposalQueryBuilder {
  private projectId!: string
  private energyTargetPct = 100
  private horizonYears = 20
  private inflationPct = 4
  private discountRatePct?: number
  private brandWhitelist?: string[]
  private criteria: Criterion[] = []

  static forProject(projectId: string): ProposalQueryBuilder {
    const b = new ProposalQueryBuilder()
    b.projectId = projectId
    return b
  }

  coverDemand(pct: number)              { this.energyTargetPct = pct; return this }
  overHorizon(years: number)            { this.horizonYears = years; return this }
  withInflation(pct: number)            { this.inflationPct = pct; return this }
  withDiscountRate(pct: number)         { this.discountRatePct = pct; return this }
  restrictToBrands(brands: string[])    { this.brandWhitelist = brands; return this }
  filterBy(criterion: Criterion)        { this.criteria.push(criterion); return this }

  build(): ProposalQuery {
    if (!this.projectId) throw new Error('projectId required')
    if (this.energyTargetPct <= 0 || this.energyTargetPct > 200)
      throw new InvalidQueryError('energyTargetPct out of bounds')
    return Object.freeze({
      projectId: this.projectId,
      params: {
        energyDemandTargetPct: this.energyTargetPct,
        horizonYears: this.horizonYears,
        energyInflationPctPerYear: this.inflationPct,
        discountRatePct: this.discountRatePct,
      },
      brandWhitelist: this.brandWhitelist,
      criteria: [...this.criteria],
    })
  }
}
```

### Why Builder (and not a constructor)

- Many optional knobs (target %, horizon, inflation, discount rate, brand filter, criteria stack).
- Fluent reads naturally for the consultant: `ProposalQueryBuilder.forProject(id).coverDemand(80).withInflation(5).filterBy(new CriteriaLowestROI()).build()`.
- `build()` is the only place validation runs — invalid queries can't exist.
- `Object.freeze` on the result makes the query immutable through the pipeline.

---

## Pattern 2 — Criteria (for picking among `RawProposal[]`)

### Interface

```ts
// domain/criteria/criterion.ts

export interface Criterion {
  matches(p: RawProposal): boolean       // filter predicate
  compare?(a: RawProposal, b: RawProposal): number   // optional ranker
}
```

A criterion can be a **filter** (predicate), a **ranker** (comparator), or both. The pipeline applies all filters, then sorts by the first ranker that defines `compare`, then returns either the top result or the whole filtered set per the use case.

### Concrete criteria

```
CriteriaFitsSurface       — keeps p.layout.fitsSurface === true
CriteriaMeetsTarget       — keeps p.energy.targetMetPct === true
CriteriaBrand(brand)      — keeps p.panel.brand === brand
CriteriaPriceRange(min,max) — keeps capex in [min,max]

CriteriaLowestROI         — ranks by p.finance.roi20YearPct ASC   (per the brief)
CriteriaHighestROI        — ranks by p.finance.roi20YearPct DESC
CriteriaLowestCost        — ranks by p.finance.capexTotal ASC
CriteriaHighestCost       — ranks by p.finance.capexTotal DESC
CriteriaShortestPayback   — ranks by p.finance.paybackYear ASC (null = Infinity)
```

> Note on "lowest ROI" — the brief asks for "the option with the lowest ROI" *and* "the cheapest option, the most expensive option". We expose both directions so the consultant can choose explicitly. The brief's literal `CriteriaLowestROI` is wired as a named criterion.

### Combinators

```
class AndCriterion implements Criterion {
  constructor(private readonly children: Criterion[]) {}
  matches(p)       { return this.children.every(c => c.matches(p)) }
}

class OrCriterion implements Criterion { ... children.some ... }

class NotCriterion implements Criterion { matches(p) { return !this.child.matches(p) } }
```

No hardcoded if/else chains in use cases — the use case just runs the criteria stack.

### Application

```ts
class CriteriaPipeline {
  constructor(private readonly criteria: Criterion[]) {}

  apply(candidates: RawProposal[]): { filtered: RawProposal[]; optimal: RawProposal | null } {
    const filtered = candidates.filter(p => this.criteria.every(c => c.matches(p)))
    const ranker = this.criteria.find(c => c.compare)
    if (ranker) filtered.sort(ranker.compare!.bind(ranker))
    return { filtered, optimal: filtered[0] ?? null }
  }
}
```

---

## Domain model

```
Proposal
  id: UUID
  tenantId: UUID
  projectId: UUID
  query: ProposalQuery                # snapshot of the query that produced it
  rawCandidates: RawProposal[]        # all viable candidates from the engine
  optimal: RawProposal | null         # selected via criteria pipeline
  status: 'DRAFT' | 'EXPORTED'
  exportedPdfRef?: string
  createdBy: UUID                     # userId
  createdAt: Date
```

A `Proposal` is the **result of running a query**. The consultant can run multiple queries → multiple Proposal rows. When they're happy with one, they hit "approve" on the *project* (the project-client service tracks `selectedProposalId`).

---

## Use cases

| Use case | Caller | Notes |
|----------|--------|-------|
| `GenerateProposalUseCase` | SolarConsultant | Build query → run engine → apply criteria → persist Proposal |
| `ListProposalsUseCase` | SolarConsultant | All proposals for a project |
| `GetProposalUseCase` | SolarConsultant | |
| `ExportProposalPdfUseCase` | SolarConsultant | Uses `PdfRendererPort`, stores via `BlobStoragePort`, returns URL |
| `DeleteProposalUseCase` | SolarConsultant | Only DRAFTs |

The HTTP DTO for `Generate` doesn't expose the builder directly — it accepts plain JSON:

```json
POST /projects/:projectId/proposals
{
  "energyDemandTargetPct": 80,
  "horizonYears": 20,
  "energyInflationPctPerYear": 4,
  "discountRatePct": 6,
  "brandWhitelist": ["LG", "JinkoSolar"],
  "criteria": [
    { "type": "fitsSurface" },
    { "type": "meetsTarget" },
    { "type": "lowestROI" }
  ]
}
```

The controller calls a `ProposalQueryFactory` that maps this JSON to builder calls (so the builder stays the canonical construction path internally, and we don't expose Java-style fluent JSON).

---

## Generate flow (end-to-end)

```
GenerateProposalUseCase.execute(input):
  1. project = projectRepo.findById(input.projectId)
  2. consumption = consumptionRepo.findByProject(project.id)        // via CatalogQueryPort-style read port from data-ingestion? See note below
  3. surface = surfaceRepo.findByProject(project.id)
  4. catalog = catalogQueryPort.listPanels(tenantId), listInverters(tenantId)
  5. query = ProposalQueryFactory.fromInput(input).build()
  6. engineInput = adaptToCalculationInput(project, consumption, surface, catalog, query)
  7. candidates = solarCalculationEngine.calculate(engineInput)
  8. { filtered, optimal } = new CriteriaPipeline(query.criteria).apply(candidates)
  9. proposal = Proposal.create({ projectId, query, rawCandidates: filtered, optimal, createdBy })
  10. repo.save(proposal)
  11. eventBus.publish('proposal.generated', { proposalId, tenantId, projectId })
  12. return proposal
```

**Cross-module reads (steps 2–4):** the proposal generator depends on read-only ports declared in `application/ports/`:
- `ConsumptionReaderPort` (impl in data-ingestion infra)
- `SurfaceReaderPort` (impl in data-ingestion infra)
- `CatalogQueryPort` (impl in catalog infra; defined in `shared/types/`)

These are the only sanctioned synchronous reads across module boundaries.

---

## PDF export (FR6)

`PdfRendererPort.render(proposal): Promise<Buffer>`

**Implementation choice: Puppeteer (HTML→PDF).** Author the proposal template as a server-side React component or Handlebars template; Puppeteer renders deterministically. Rejected: `pdfkit` (manual coordinate math is painful), online services (privacy + cost).

The exported PDF includes (per FR6):
- Project summary (client, site address)
- System design: chosen panel, inverter, panel count, layout
- Production estimates with year-by-year savings table
- ROI summary, payback year, NPV (if computed)
- Tenant branding header (tenant.name) — branding assets handled in v1.1; v1 = text-only header

---

## HTTP surface

```
POST   /projects/:projectId/proposals         # generate
GET    /projects/:projectId/proposals         # list
GET    /proposals/:id
DELETE /proposals/:id
POST   /proposals/:id/export                  # returns { url }
```

---

## Events

| Event | Payload | When |
|-------|---------|------|
| `proposal.generated` | `{ proposalId, tenantId, projectId }` | After save |
| `proposal.exported` | `{ proposalId, tenantId, pdfRef }` | After PDF stored |

---

## Persistence

```sql
CREATE TABLE proposal (
  id                UUID PRIMARY KEY,
  tenant_id         UUID NOT NULL,
  project_id        UUID NOT NULL,
  query             JSONB NOT NULL,
  raw_candidates    JSONB NOT NULL,    -- snapshot
  optimal           JSONB,             -- nullable when no candidate matched
  status            TEXT NOT NULL,
  exported_pdf_ref  TEXT,
  created_by        UUID NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX proposal_project_idx ON proposal(project_id);
CREATE INDEX proposal_tenant_idx  ON proposal(tenant_id);
```

We **snapshot** `raw_candidates` rather than re-running the engine on read. The catalog can change tomorrow; the proposal as shown to the client is frozen in time.

---

## Folder layout

```
proposal-generator/
├─ domain/
│   ├─ entities/proposal.entity.ts
│   ├─ value-objects/proposal-query.vo.ts
│   ├─ builders/proposal-query.builder.ts
│   ├─ criteria/
│   │   ├─ criterion.ts                  # interface
│   │   ├─ criteria-pipeline.ts
│   │   ├─ and.criterion.ts
│   │   ├─ or.criterion.ts
│   │   ├─ not.criterion.ts
│   │   ├─ fits-surface.criterion.ts
│   │   ├─ meets-target.criterion.ts
│   │   ├─ brand.criterion.ts
│   │   ├─ price-range.criterion.ts
│   │   ├─ lowest-roi.criterion.ts
│   │   ├─ highest-roi.criterion.ts
│   │   ├─ lowest-cost.criterion.ts
│   │   ├─ highest-cost.criterion.ts
│   │   └─ shortest-payback.criterion.ts
│   ├─ errors/{invalid-query,no-candidates}.error.ts
│   └─ repositories/proposal.repository.ts
├─ application/
│   ├─ use-cases/
│   │   ├─ generate-proposal.use-case.ts
│   │   ├─ list-proposals.use-case.ts
│   │   ├─ get-proposal.use-case.ts
│   │   ├─ export-proposal-pdf.use-case.ts
│   │   └─ delete-proposal.use-case.ts
│   ├─ factories/proposal-query.factory.ts   # JSON → Builder calls
│   ├─ ports/
│   │   ├─ consumption-reader.port.ts
│   │   ├─ surface-reader.port.ts
│   │   └─ pdf-renderer.port.ts
│   └─ dto/
└─ infrastructure/
    ├─ http/proposals.controller.ts
    ├─ persistence/...
    ├─ adapters/puppeteer-pdf-renderer.adapter.ts
    ├─ templates/proposal.template.tsx        # or .hbs
    └─ proposal-generator.module.ts
```

---

## Implementation order

1. Lock DTO contract with calc engine + catalog teams.
2. Domain: ProposalQuery VO, Builder, Criterion interface, pipeline. Heavy unit test pass.
3. Each concrete criterion as its own file + test.
4. ORM + migration for `proposal`.
5. Ports + factory.
6. `GenerateProposalUseCase` with integration test (real engine, real catalog, in-memory data-ingestion).
7. List/Get/Delete.
8. PDF template (HTML), Puppeteer adapter, ExportProposal use case.
9. Controllers + DTO validation + integration tests.

---

## Open questions

- **Returning filtered set vs single optimal?** Both. `optimal` is the convenience pick; `rawCandidates` (already filtered by the predicate criteria) is shown as a comparison table in the UI.
- **Background-render PDFs?** Synchronous via Puppeteer in v1. If render time exceeds 3s in practice, move to a BullMQ worker.
- **Template versioning?** Bake template version into the PDF; v1 = `v1`. Future re-exports may differ; document this.
