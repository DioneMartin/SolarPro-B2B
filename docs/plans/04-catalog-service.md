# 04 — Catalog Service

> Per-tenant hardware catalog of panels and inverters with **flexible schemas**. The Solar Calculation Engine consumes a **normalized DTO**, not the raw catalog rows.

Folder: `backend/src/catalog/`

---

## The core tension

> *"How the data is stored must be flexible, since companies can vary in the data they save in their catalog… a unified way to transfer data between services must be created, even if they are not stored in the same format."*

This translates directly to:

- **Persistence is flexible** (JSONB).
- **Inter-service contract is rigid** (`PanelSpec` and `InverterSpec` DTOs).
- The boundary that converts flexible → rigid is the **Specification + Normalizer**, owned by this service.

---

## Domain model

```
PanelModel
  id: UUID
  tenantId: UUID
  brand: string
  modelName: string
  rawSpecs: jsonb               # arbitrary fields the tenant chose
  normalizedSpecs: PanelSpec    # canonical view, derived on save
  unitCost: Money
  status: 'active' | 'discontinued'
  createdAt, updatedAt

InverterModel
  id: UUID
  tenantId: UUID
  brand: string
  modelName: string
  rawSpecs: jsonb
  normalizedSpecs: InverterSpec
  unitCost: Money
  status: 'active' | 'discontinued'
```

### Canonical specs (the contract)

```ts
// shared/types/panel-spec.ts
export interface PanelSpec {
  wattagePeakW: number             // FR2 — required
  efficiencyPct: number            // 0..100, required
  voltageOpenCircuitV?: number
  currentShortCircuitA?: number
  areaSqM: number                  // required (calc engine needs it)
  warrantyYears?: number
  temperatureCoefPctPerC?: number
}

export interface InverterSpec {
  nominalVoltageV: number          // FR2 — required
  maxOutputCapacityW: number       // required ("capacity")
  efficiencyPct?: number
  mpptInputs?: number
  phases?: 1 | 3
}
```

Required fields are the **non-negotiables** for the calculation engine. Anything else is optional metadata that flows through to the proposal PDF.

---

## Normalization (flexible → rigid)

When a panel is created/updated:

1. The HTTP DTO accepts:
   - `brand`, `modelName`, `unitCost`
   - `specs` — `Record<string, unknown>` (anything)
   - `mapping?` — optional explicit hints (`{ "watts": "wattagePeakW" }`)
2. The `SpecNormalizer` domain service tries to derive `normalizedSpecs`:
   - Apply tenant-wide field-alias config first (`config.catalogAliases`).
   - Apply per-request `mapping` overrides.
   - Fall back to fuzzy matching on common keys (`watts|wattage|peak_w → wattagePeakW`; `efficiency|eff_pct → efficiencyPct`).
3. If a **required** field can't be normalized, throw `IncompletePanelSpecError` listing missing fields. The InventoryManager must edit the mapping and retry.
4. Persist **both** `rawSpecs` (preserves the original shape) and `normalizedSpecs` (used by the engine).

This means: tenants get to keep their idiosyncratic shapes; the engine never sees them.

---

## Use cases

| Use case | Caller | Notes |
|----------|--------|-------|
| `RegisterPanelUseCase` | InventoryManager | Validates required normalized fields |
| `UpdatePanelUseCase` | InventoryManager | Re-runs normalizer |
| `DiscontinuePanelUseCase` | InventoryManager | Soft delete via status flag |
| `RegisterInverterUseCase` / `UpdateInverterUseCase` / `DiscontinueInverterUseCase` | InventoryManager | |
| `ListPanelsUseCase` / `ListInvertersUseCase` | any tenant role | Filterable (active only by default) |
| `GetPanelSpecsUseCase` / `GetInverterSpecsUseCase` | **internal, called by calc engine** | Returns `PanelSpec[]` / `InverterSpec[]` — the normalized DTOs, never the raw |
| `UpsertFieldAliasUseCase` | InventoryManager | Edit the tenant's catalog alias config |

---

## Cross-module port exposed to the calculation engine

The calculation engine doesn't read this module's tables. It calls a port:

```ts
// shared/types/catalog-query.ts  (lives in shared so calc can import the interface)
export interface CatalogQueryPort {
  listPanels(tenantId: string): Promise<PanelCatalogItem[]>
  listInverters(tenantId: string): Promise<InverterCatalogItem[]>
}

export interface PanelCatalogItem {
  id: string
  brand: string
  modelName: string
  spec: PanelSpec               // normalized
  unitCost: Money
}
```

The implementation `CatalogQueryAdapter` lives in `catalog/infrastructure/`, registered against the token in `app.module.ts`. The calc engine imports only the interface from `shared/types`.

This is the **only** sanctioned cross-module synchronous read in the system. We accept it because:
- The contract is small (two methods, immutable DTOs).
- The alternative (events to replicate the catalog into the calc engine's DB) is much heavier for marginal benefit.

---

## HTTP surface

```
# Panels
POST    /catalog/panels              # INVENTORY_MANAGER
GET     /catalog/panels              # any role within tenant
GET     /catalog/panels/:id
PATCH   /catalog/panels/:id
DELETE  /catalog/panels/:id          # soft-discontinue

# Inverters
POST    /catalog/inverters
GET     /catalog/inverters
GET     /catalog/inverters/:id
PATCH   /catalog/inverters/:id
DELETE  /catalog/inverters/:id

# Aliases (tenant config)
GET     /catalog/aliases
PUT     /catalog/aliases             # body: { panels: {...}, inverters: {...} }
```

---

## Events

| Event | Payload | When |
|-------|---------|------|
| `catalog.panel.upserted` | `{ panelId, tenantId }` | create/update |
| `catalog.inverter.upserted` | `{ inverterId, tenantId }` | create/update |

The calc engine **does not** subscribe to these (it fetches fresh on demand). They exist for a future "recalculate proposals when catalog changes" v1.1 feature.

---

## Persistence

```sql
CREATE TABLE panel_model (
  id                UUID PRIMARY KEY,
  tenant_id         UUID NOT NULL,
  brand             TEXT NOT NULL,
  model_name        TEXT NOT NULL,
  raw_specs         JSONB NOT NULL,
  normalized_specs  JSONB NOT NULL,    -- conforms to PanelSpec
  unit_cost         JSONB NOT NULL,    -- Money VO
  status            TEXT NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, brand, model_name)
);
CREATE INDEX panel_tenant_active_idx ON panel_model(tenant_id, status);

CREATE TABLE inverter_model (...);     -- same shape

CREATE TABLE catalog_alias (
  tenant_id  UUID PRIMARY KEY,
  panels     JSONB NOT NULL DEFAULT '{}',
  inverters  JSONB NOT NULL DEFAULT '{}'
);
```

---

## Folder layout

```
catalog/
├─ domain/
│   ├─ entities/{panel-model,inverter-model}.entity.ts
│   ├─ value-objects/{money}.vo.ts
│   ├─ services/spec-normalizer.ts
│   ├─ errors/incomplete-spec.error.ts
│   └─ repositories/...
├─ application/
│   ├─ use-cases/...
│   └─ dto/
└─ infrastructure/
    ├─ http/{panels,inverters,aliases}.controller.ts
    ├─ persistence/...
    ├─ adapters/catalog-query.adapter.ts   # implements CatalogQueryPort
    └─ catalog.module.ts
```

---

## Implementation order

1. `PanelSpec` / `InverterSpec` interfaces in `shared/types/`. Lock this contract first.
2. Domain entity + SpecNormalizer (pure, heavily unit-tested with fixtures).
3. ORM + migration.
4. Register/update/list use cases for Panel.
5. Same for Inverter.
6. Field alias config CRUD.
7. `CatalogQueryAdapter` exposing the cross-module port.
8. Controllers + integration tests, including a "weird tenant shape" fixture.

---

## Open questions

- **Should `unitCost` be a single number or a price list (volume tiers, time-based)?** v1: single number. v1.1: price list — adapter returns the current applicable price.
- **Image attachments per panel?** v2. Don't pollute v1.
- **Where does currency live?** Tenant setting; per-row override allowed. Money VO carries both amount + currency.
