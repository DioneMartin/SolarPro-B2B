# 05 — Solar Calculation Engine

> The math core. Given a project's consumption + surface + the tenant's catalog, produces a set of **raw proposal candidates** the Proposal Generator then filters.

Folder: `backend/src/solar-calculation/`

---

## Why this is its own module

It's pure logic — no HTTP surface owned by users, no own tables. But isolating it pays off because:
- The math has to be **deterministic and testable**.
- It must not know how panels are stored ([catalog plan](04-catalog-service.md) handles that).
- The proposal generator can swap in a different engine implementation later (e.g. ML-tuned) without changing callers.

The engine is exposed as a **port** that the proposal generator consumes. There are no consultant-facing endpoints on this module (the consultant interacts with the proposal generator, which calls this).

---

## The inputs

All inputs are DTOs from `shared/types/`. The engine does not import other modules' domain.

```ts
export interface CalculationInput {
  projectId: string
  tenantId: string
  consumption: {
    months: { year: number; month: number; kwh: number }[]
    tariff?: { currency: string; pricePerKwh: number; fixedFee?: number }
  }
  surface: {
    usableSqMeters: number
    annualIrradiationKwhPerSqM: number
  }
  catalog: {
    panels: PanelCatalogItem[]       // already normalized
    inverters: InverterCatalogItem[]
  }
  parameters: {
    energyDemandTargetPct: number    // 0..100  (e.g. 80 = cover 80% of consumption)
    horizonYears: number             // default 20 (FR5)
    energyInflationPctPerYear: number // default 4
    systemLossFactor: number         // default 0.85 (DC/AC, dust, temp losses)
    discountRatePct?: number         // optional for NPV; default 0
  }
}
```

---

## The outputs

```ts
export interface RawProposal {
  id: string                          // deterministic hash of inputs+pick
  panel: { id: string; brand: string; modelName: string; spec: PanelSpec; unitCost: Money }
  inverter: { id: string; brand: string; modelName: string; spec: InverterSpec; unitCost: Money }
  panelCount: number
  layout: { usedSqMeters: number; availableSqMeters: number; fitsSurface: boolean }
  energy: {
    annualConsumptionKwh: number
    annualProductionKwh: number
    coveragePct: number               // production / consumption
    targetMetPct: boolean             // coverage ≥ target?
  }
  finance: {
    capexTotal: Money
    annualSavings: Money[]            // length = horizonYears
    cumulativeSavings: Money[]        // same length
    paybackYear?: number              // first year cumulative ≥ capex
    roi20YearPct: number              // (cum[19] - capex) / capex * 100
    npv?: Money                       // present if discountRate given
  }
  provenance: {
    surfaceWasManualOverride: boolean
    consumptionSource: 'MANUAL' | 'OCR_PDF' | 'OCR_IMAGE'
    calculatedAt: string
  }
}

export type CalculationOutput = RawProposal[]   // one per (panel, inverter) combo that fits
```

The engine does **not** decide which proposal is "best". It produces *all viable candidates*; the Proposal Generator filters via Criteria.

---

## The math

### A. Annualize consumption
```
annualConsumptionKwh = sum(months[].kwh) * (12 / months.length)
```
(Scales up if we have <12 months. Refuse if <3.)

### B. For each (panel, inverter) combination

1. **Required production** = `annualConsumptionKwh * (energyDemandTargetPct / 100)`
2. **Per-panel production** = `panel.spec.wattagePeakW * (irradiation/1000) * systemLossFactor`
   (Watts → kWh annual via the standard kWh/m² × W/m²-rated relation.)
3. **Panel count** = `ceil(requiredProduction / perPanelProduction)`
4. **Surface check** — `panelCount * panel.spec.areaSqM <= usableSqMeters`. If false, the combination is still emitted with `fitsSurface=false` (so the consultant *sees* why a brand doesn't work).
5. **Inverter sizing** — total panel DC capacity = `panelCount * panel.spec.wattagePeakW`. Pick inverter only if `inverter.spec.maxOutputCapacityW * 1.2 >= totalDc` (oversize tolerance). One inverter for now; multi-inverter layouts deferred.

### C. Finance

For year `y in 0..horizonYears-1`:
- `tariffYear = pricePerKwh * (1 + inflation)^y`
- `annualProductionKwh` is held constant (no degradation in v1; add `0.5%/yr` in v1.1).
- `annualSavings[y] = annualProductionKwh * tariffYear`
- `cumulativeSavings[y] = cumulativeSavings[y-1] + annualSavings[y]`
- `paybackYear = first y where cumulativeSavings[y] >= capexTotal`
- `roi20YearPct = (cumulativeSavings[19] - capexTotal) / capexTotal * 100`

If `discountRatePct` supplied:
- `npv = sum( annualSavings[y] / (1+r)^(y+1) ) - capexTotal`

`capexTotal = panel.unitCost * panelCount + inverter.unitCost`. (Installation labor and BOS markup are tenant-configurable in v1.1; v1 = bare hardware cost.)

---

## Determinism

Same input → same output, bit for bit. Required for:
- Snapshotting raw proposals so the same selection survives a recalculation when the catalog changes.
- Snapshot/golden tests in CI.

Sources of nondeterminism to avoid:
- `Date.now()` → take `calculatedAt` from an injected `Clock` port.
- `Math.random()` → never used.
- Object key ordering → emit arrays sorted deterministically (by `panel.id` then `inverter.id`).

---

## Domain service shape

```ts
@Injectable()
export class SolarCalculationEngine {
  constructor(private readonly clock: ClockPort) {}

  calculate(input: CalculationInput): CalculationOutput {
    // pure, synchronous
  }
}
```

The engine itself is **synchronous and pure** (modulo Clock). The proposal generator can call it inside a use case without awaiting anything. If the catalog grows large (1000+ panels × 100 inverters = 100k combos), we add pruning (skip combos where `panel.wattage < required/maxPanels`) — but v1 doesn't need it.

---

## Outbound ports

```
ClockPort
  now(): Date
```

That's it. Catalog and surface/consumption data are *passed in* by the caller (proposal generator), not fetched by the engine. This keeps the engine pure.

---

## Events

| Event | Payload | When |
|-------|---------|------|
| `calculation.completed` | `{ projectId, tenantId, candidateCount }` | After a successful run |

The proposal generator does **not** subscribe — it calls the engine synchronously. The event exists for analytics / future audit.

---

## Folder layout

```
solar-calculation/
├─ domain/
│   ├─ services/
│   │   ├─ solar-calculation.engine.ts
│   │   ├─ consumption-aggregator.ts        # pure helpers
│   │   ├─ panel-sizing.ts
│   │   ├─ inverter-matcher.ts
│   │   └─ finance.ts
│   └─ errors/
│       ├─ insufficient-consumption.error.ts
│       └─ no-viable-combination.error.ts
├─ application/
│   ├─ ports/clock.port.ts
│   └─ use-cases/
│       └─ run-calculation.use-case.ts      # thin wrapper (audit log + event)
└─ infrastructure/
    ├─ adapters/system-clock.adapter.ts
    └─ solar-calculation.module.ts
```

No `http/`, no `persistence/`. This is the cleanest module by design.

---

## Testing strategy

Five layers of tests, in order of value:

1. **Golden tests** — fixed input fixtures (small catalog, known consumption, known irradiation), expected output JSON checked in. Catches any drift.
2. **Property tests** (fast-check): `panelCount * perPanelProduction >= requiredProduction` always. `cumulativeSavings` is monotonic. `roi20YearPct` increases as `pricePerKwh` increases.
3. **Edge cases**: zero usable area, 3 months consumption, single panel in catalog, no inverter fits.
4. **Determinism test**: run twice, assert deep equality.
5. **Performance**: 100-panel × 20-inverter catalog runs in < 50 ms.

---

## Implementation order

1. Lock the DTOs in `shared/types/`. **Do this in coordination with the catalog and proposal-generator teams.**
2. Pure helpers (`consumption-aggregator`, `panel-sizing`, `inverter-matcher`, `finance`) with TDD.
3. Compose them in `SolarCalculationEngine`.
4. `RunCalculationUseCase` wrapper that publishes the `calculation.completed` event.
5. Golden + property tests.
6. Wire DI in module.

---

## Open questions

- **Panel degradation curve?** v1 ignores; v1.1 adds 0.5%/year.
- **Multi-string inverter layouts?** v2.
- **Battery storage?** Out of scope; future "Storage" module would feed an extended DTO into the engine.
- **Currency in finance output** inherits from tariff. Different currencies in catalog vs tariff → throw `CurrencyMismatchError` (no FX in v1).
