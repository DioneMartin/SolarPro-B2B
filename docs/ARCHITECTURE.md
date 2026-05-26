# SolarPro — Architecture Decisions

> Authoritative source for *what* we build and *why*. Every plan in `docs/plans/` refers back to this document.

---

## 1. High-level shape

SolarPro is a **multi-tenant B2B SaaS** for solar-panel installation companies. Each tenant (an installation company) has its own users, clients, projects, hardware catalog, and proposals. Data isolation between tenants is a non-negotiable invariant.

### 1.1 Deployment model — Modular Monolith

We deploy **one NestJS application** ([backend/](../backend/)) composed of **seven bounded-context modules**, plus one React SPA ([frontend/](../frontend/)).

```
backend/src/
├─ shared/                     # cross-cutting: event bus, errors, tenant context, base entities
├─ user-tenant/                # Service 1: TenantAdmin, users, auth
├─ project-client/             # Service 2: clients, projects, dashboards
├─ data-ingestion/             # Service 3: OCR + Google Solar API
├─ catalog/                    # Service 6: flexible hardware catalog (panels, inverters)
├─ solar-calculation/          # Service 4: sizing engine
├─ proposal-generator/         # Service 5: Builder + Criteria filters, PDF export
├─ alerts/                     # Service 7: Strategy-pattern alerts, weather/time
└─ app.module.ts
```

**Why monolith over microservices** — A student team cannot operate seven independently deployable services responsibly. We get the *design* benefits of service boundaries (folders, no cross-module imports, async eventing) without the *operational* cost (seven Dockerfiles, seven CI pipelines, distributed tracing, schema-per-service migrations). Splitting later is a refactor, not a rewrite, because we enforce the rules below from day one.

### 1.2 The boundary rules

These are enforced by code review, not by tooling — break them and the monolith stops being splittable:

1. **No cross-module imports of `domain/` or `infrastructure/`.** A module may import another module's `application/` *contracts* (interfaces, DTOs) only if absolutely necessary. Prefer events.
2. **All cross-module communication on the write path is via events** published to `shared/event-bus`. Synchronous reads across modules go through a published *Query Port* (an interface in `application/ports/`).
3. **Each module owns its tables.** No foreign keys across module schemas. References are by ID only; integrity is eventual.
4. **Each module's `infrastructure/http` exposes its own controllers.** No "god controller" that aggregates services.

---

## 2. Clean Architecture, per module

Every service folder follows the same three-layer structure. **Inner layers must not import outer layers.**

```
<module>/
├─ domain/
│   ├─ entities/          # plain TS classes, no decorators, no NestJS, no TypeORM
│   ├─ value-objects/     # immutable, self-validating
│   ├─ events/            # domain events (e.g. ProjectApproved)
│   ├─ errors/            # domain-specific exceptions
│   └─ repositories/      # repository *interfaces* (ports)
├─ application/
│   ├─ use-cases/         # one class per use case, single execute() method
│   ├─ ports/             # outbound ports (interfaces for external services)
│   ├─ dto/               # input/output DTOs for use cases
│   └─ services/          # orchestration helpers (rare; prefer use cases)
└─ infrastructure/
    ├─ http/              # NestJS controllers + DTOs (class-validator)
    ├─ persistence/       # TypeORM entities + repository implementations
    ├─ adapters/          # external API clients (Google Solar, OpenAI OCR, etc.)
    └─ <module>.module.ts # wires DI: maps interface → implementation
```

### 2.1 The dependency rule (concrete)

| Layer | Can import from |
|-------|-----------------|
| `domain/` | itself only |
| `application/` | own `domain/`, `shared/` |
| `infrastructure/` | own `application/`, own `domain/`, `shared/`, NestJS, TypeORM, third-party SDKs |

If a use case needs to call an external API, the use case depends on an **interface in `application/ports/`**, and the implementation lives in `infrastructure/adapters/`. DI wires them.

### 2.2 What goes in `shared/`

```
shared/
├─ event-bus/             # Redis pub/sub publisher + subscriber base
├─ tenant-context/        # AsyncLocalStorage-based tenant scope + interceptor
├─ auth/                  # JWT guard, role decorator (used by all modules)
├─ errors/                # base AppError, ErrorCode enum, global filter
├─ database/              # TypeORM datasource, base entity with tenantId
└─ types/                 # cross-cutting DTO contracts (e.g. CalculationResultDto)
```

`shared/` is the *only* allowed cross-module import. Keep it thin.

---

## 3. Multi-tenancy

**Every tenant-scoped entity has a non-null `tenantId` column.** Enforced three ways:

1. **Base entity** in `shared/database` ships `tenantId`, `createdAt`, `updatedAt`.
2. **TenantContext** (AsyncLocalStorage) populated by an auth interceptor reading the JWT claim. Every repository read auto-injects `WHERE tenantId = :current`.
3. **Migrations are reviewed** to ensure no tenant-scoped table is missing the column or its index.

The only entities **without** `tenantId` are: `Tenant` itself, system-level config, and Catalog *templates* shared across tenants (if any — see Catalog plan).

---

## 4. Event bus

Redis Pub/Sub (Redis is already in `docker-compose.yml`). Wrapped by `shared/event-bus`:

```
publisher.publish('project.approved', { projectId, tenantId, ... })
subscriber.on('project.approved', handler)
```

Events are **fire-and-forget**. Handlers are idempotent and tenant-aware. If we later need durability we swap the publisher impl — no caller changes.

### 4.1 Published events (initial catalogue)

| Event | Publisher | Subscribers |
|-------|-----------|-------------|
| `tenant.created` | user-tenant | — |
| `user.created` | user-tenant | — |
| `consumption.updated` | data-ingestion | solar-calculation |
| `surface.updated` | data-ingestion | solar-calculation |
| `calculation.completed` | solar-calculation | proposal-generator |
| `proposal.generated` | proposal-generator | — |
| `project.approved` | project-client | alerts |
| `alert.triggered` | alerts | (WebSocket → frontend) |

---

## 5. Authentication & roles

- **JWT bearer tokens**, signed with a per-env secret.
- Claims: `sub` (userId), `tenantId`, `role`.
- Roles: `TENANT_ADMIN`, `SOLAR_CONSULTANT`, `INVENTORY_MANAGER`, `OPERATIONS`.
- `@Roles('TENANT_ADMIN')` decorator on controllers; guard in `shared/auth`.
- A `TenantAdmin` is created out-of-band (signup endpoint or seed) and is the only role that can create other users in that tenant.

---

## 6. Persistence

- **PostgreSQL** for relational data (users, tenants, clients, projects, proposals, alerts).
- **JSONB** columns for "flexible schema" data (catalog specs, project ingestion payloads). See [Catalog plan](plans/06-catalog-service.md).
- **TypeORM** as the ORM. Migrations checked in. No `synchronize: true` outside local dev.
- **Redis** for: event bus, OCR job queue (BullMQ), short-lived caches (Google Solar responses keyed by address hash).

---

## 7. Key pattern choices per service

| Service | Patterns | Reason |
|---------|----------|--------|
| user-tenant | Repository, JWT guard | Standard CRUD |
| project-client | Repository, Aggregate (Project root) | Project owns its consumption + surface refs |
| data-ingestion | Adapter (OCR providers), Strategy (manual vs OCR vs API) | Multiple ingestion sources |
| catalog | **Specification + JSONB** | Heterogeneous spec shapes per tenant |
| solar-calculation | Pure domain service, **DTO-based input/output** | Stateless math; isolates from catalog storage shape |
| proposal-generator | **Builder** (query) + **Criteria** (filter) | Per user's explicit requirement |
| alerts | **Strategy** (TimeBased, WeatherBased) + Adapter (Weather/Air/Pollen APIs) | Per user's explicit requirement |

---

## 8. Frontend architecture

The frontend ([frontend/](../frontend/)) is the **Client Application** box in the C4 diagram. It is *not* a Clean-Architecture project — that ceremony doesn't pay back in a React SPA. Instead:

```
frontend/src/
├─ app/                   # routing, providers, root layout
├─ features/              # one folder per backend service (mirror)
│   ├─ user-tenant/
│   ├─ project-client/
│   ├─ data-ingestion/
│   ├─ catalog/
│   ├─ proposal-generator/
│   └─ alerts/
├─ shared/                # ui kit, api client, auth store, ws client
└─ pages/                 # route components composing features
```

State: React Query for server state, Zustand for local UI state. WebSocket client subscribes to `alert.triggered` for live notifications.

---

## 9. Anti-goals (deliberate non-features)

- **No GraphQL.** REST is enough; we don't have a cross-service join problem worth GraphQL's cost.
- **No event sourcing.** State + domain events published outward is sufficient.
- **No CQRS separation of read/write models** at the DB level. Use the same TypeORM repos for both.
- **No microfrontends.**
- **No i18n/a11y/SSR rabbit holes** in v1. Single locale, CSR only.

---

## 10. Open questions to resolve before coding

1. **OCR provider** — Tesseract (self-hosted, free, mediocre on photos) vs Google Vision vs AWS Textract. The data-ingestion plan picks one default but the adapter pattern lets us swap.
2. **PDF generation** — `pdfkit`, `puppeteer` (HTML→PDF), or a templating service. Proposal-generator plan picks one.
3. **Frontend UI kit** — pick one (e.g. Mantine, Chakra, shadcn) early; arbitrary later costs.

See each service plan for the recommendation and rationale.
