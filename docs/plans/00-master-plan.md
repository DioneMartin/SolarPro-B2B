# Master Plan — Orchestrating SolarPro

> Top-level sequencing. Each service's deep-dive lives in its own `0X-*.md` file. Read [../ARCHITECTURE.md](../ARCHITECTURE.md) and [../CLEAN_ARCHITECTURE.md](../CLEAN_ARCHITECTURE.md) first.

---

## Why this order

We sequence services by **what unblocks what**:

```
        ┌──────────────────────┐
        │  M0  Foundation      │  shared/, auth, multitenancy, event bus
        └──────────┬───────────┘
                   │
        ┌──────────▼───────────┐
        │  M1  user-tenant     │  Service 1 — gates everything (tenants + users + JWT)
        └──────────┬───────────┘
                   │
   ┌───────────────┼─────────────────┐
   │               │                 │
┌──▼────────┐ ┌────▼──────┐  ┌───────▼────────┐
│ M2 project│ │ M3 catalog│  │ M4 data-ingest │
│  -client  │ │           │  │                │
└──┬────────┘ └────┬──────┘  └───────┬────────┘
   │               │                 │
   └───────────────┼─────────────────┘
                   │
        ┌──────────▼───────────┐
        │  M5 solar-calculation│  Needs project data + catalog
        └──────────┬───────────┘
                   │
        ┌──────────▼───────────┐
        │  M6 proposal-generator│  Consumes calculation output
        └──────────┬───────────┘
                   │
        ┌──────────▼───────────┐
        │  M7 alerts           │  Triggers off project.approved (post-proposal)
        └──────────┬───────────┘
                   │
        ┌──────────▼───────────┐
        │  M8 client-application│  Frontend grows alongside but solidifies last
        └──────────────────────┘
```

The frontend [feature folders](08-client-application.md) are built incrementally as each backend service goes live — not deferred to the end. The "M8" milestone is the final polish and integration.

---

## Milestones

### M0 — Foundation (2–3 days)

**Goal:** A boot-able NestJS app with the shared kernel ready for services to plug into.

- [ ] Add deps to `backend/package.json`: `@nestjs/typeorm typeorm pg @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer ioredis @nestjs/event-emitter`
- [ ] Create `shared/database` — TypeORM datasource, base entity (id, tenantId, createdAt, updatedAt), migration runner
- [ ] Create `shared/tenant-context` — AsyncLocalStorage + interceptor
- [ ] Create `shared/auth` — JWT module, guard, `@Roles()` decorator, `@CurrentUser()` decorator, `@CurrentTenant()` decorator
- [ ] Create `shared/event-bus` — Redis-backed publisher + subscriber abstraction (interface in `shared/event-bus/ports`, ioredis impl in `shared/event-bus/redis`)
- [ ] Create `shared/errors` — `AppError`, `ErrorCode` enum, global exception filter
- [ ] Wire `app.module.ts` to load env (`.env` via `@nestjs/config`), DB, Redis, global filter, global interceptor
- [ ] Smoke test: `GET /health` returns 200 with DB + Redis reachable

**Definition of done:** `npm run start:dev` boots cleanly with Postgres + Redis up via `docker-compose up`, and `/health` reports both green.

### M1 — User & Tenant Service (3 days)

See [01-user-tenant-service.md](01-user-tenant-service.md).

**Cuts in:** sign-up creates a Tenant + TenantAdmin in one transaction. TenantAdmin can create scoped users. JWT issued on login carries `{ sub, tenantId, role }`.

**Definition of done:** Postman flow — signup → login → TenantAdmin creates a `SOLAR_CONSULTANT` → that user logs in → all subsequent requests carry tenant scope automatically.

### M2 — Project & Client Service (3 days)

See [02-project-client-service.md](02-project-client-service.md). Builds on M1 (consumers of the tenant-scoped JWT).

**Definition of done:** Consultant can create clients, attach projects to clients, list dashboard.

### M3 — Catalog Service (3 days)

See [04-catalog-service.md](04-catalog-service.md). Builds on M1 only. Parallelizable with M2.

**Definition of done:** InventoryManager CRUDs panels and inverters with arbitrary JSONB spec shapes; calculation engine can read a normalized DTO.

### M4 — Data Ingestion Service (4 days)

See [03-data-ingestion-service.md](03-data-ingestion-service.md). Builds on M2 (needs a Project to attach data to). Parallelizable with M3.

**Definition of done:** Consultant uploads PDF → OCR extracts kWh history. Consultant submits address → Google Solar API returns roof surface + irradiation. Both editable. Both publish events.

### M5 — Solar Calculation Engine (3 days)

See [05-solar-calculation-engine.md](05-solar-calculation-engine.md). Needs M2 + M3 + M4.

**Definition of done:** Given a project ID with consumption + surface + a tenant catalog, returns an array of `RawProposal` candidates (panel count, inverter pick, projected output, cost, ROI series).

### M6 — Proposal Generator Service (3 days)

See [06-proposal-generator-service.md](06-proposal-generator-service.md). Needs M5.

**Definition of done:** Consultant builds a `ProposalQuery` via fluent API, runs it, applies `Criteria` filters (`CriteriaLowestROI`, `CriteriaLowestCost`, `CriteriaBrand`), gets an optimal proposal, exports a PDF.

### M7 — Alerts Service (3 days)

See [07-alerts-service.md](07-alerts-service.md). Needs M2 (`project.approved`).

**Definition of done:** When a project is approved, an `AlertPolicy` is registered with one or both strategies (`TimeBased`, `WeatherBased`). A cron worker evaluates policies and pushes notifications to the WebSocket channel.

### M8 — Client Application (continuous, finalized last week)

See [08-client-application.md](08-client-application.md).

**Definition of done:** All seven backend flows are reachable from the UI; WebSocket alerts surface as toasts; auth gate works; per-role nav.

---

## Cross-cutting workstreams (parallel to milestones)

- **Migrations**: every PR that touches a table includes a migration. Reviewed.
- **Seed data**: a `seed` command populates one demo tenant, one TenantAdmin, two SolarConsultants, one InventoryManager, a small catalog, and a sample project. Updated as schemas evolve.
- **OpenAPI**: enable `@nestjs/swagger`, serve at `/docs`. Used by the frontend dev team as the source of truth.
- **Tests**: domain + application coverage tracked per service; integration tests on infrastructure repositories and adapters.
- **CI**: GitHub Actions running lint + test + build on every PR to `develop`.

---

## Risk register

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Google Solar API quota / billing | Med | Cache responses by address hash; mock adapter for dev |
| OCR accuracy on photos of bills | High | Pick a robust provider (Google Vision); allow manual correction post-OCR |
| Catalog schema variability blowing up calculation math | High | Normalize at the catalog→engine boundary via `PanelSpec` / `InverterSpec` DTOs ([catalog plan](04-catalog-service.md#normalization)) |
| PDF rendering fragile across templates | Med | Pick Puppeteer (HTML→PDF) so we author proposals as React/HTML, not pdfkit primitives |
| Multitenancy leak | Critical | Base entity + interceptor + repo audit; one integration test asserts cross-tenant 404 for every read endpoint |
| Event bus drops messages | Med | Redis pub/sub is fire-and-forget; document that explicitly and design handlers idempotent. Move to durable queue only if a critical flow requires it |

---

## Team allocation (KISS Team, six people)

Suggested split — each service has a directly responsible individual but reviews are shared:

| Person | Primary | Secondary |
|--------|---------|-----------|
| Cauich Pasos Omar Jesús | Catalog (M3) | Solar Calc (M5) |
| Chan Puc Angel Adrian | User & Tenant (M1) | Frontend auth |
| Flores Juárez Víctor | Proposal Gen (M6) + Solar Calc (M5) | Frontend proposals |
| Gonzalez Lugo Angel Alberto | Data Ingestion (M4) | Frontend ingestion UI |
| Martin Valdez Dione Guadalupe | Project & Client (M2) | Frontend dashboard |
| Mendez Sierra Daniel | Alerts (M7) + Foundation (M0) | Frontend notifications |

(Reassign as the team prefers — this is a suggestion, not a hard split.)

---

## Glossary

- **Tenant** — an installation company (the SaaS customer).
- **TenantAdmin** — root user inside a tenant; can create other users.
- **SolarConsultant** — sales/technical user who works with clients.
- **InventoryManager** — maintains the hardware catalog for the tenant.
- **Operations** — monitors alerts.
- **Client** — a customer of the tenant (homeowner or company).
- **Project** — one installation scope tied to one client.
- **Proposal** — generated technical+financial document for a project.
- **AlertPolicy** — a configured strategy attached to an approved project.
