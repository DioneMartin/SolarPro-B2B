# SolarPro — Documentation

Start here when you join the project.

## Read in this order

1. [ARCHITECTURE.md](ARCHITECTURE.md) — what we're building and the system-level decisions.
2. [CLEAN_ARCHITECTURE.md](CLEAN_ARCHITECTURE.md) — the dependency rule and per-layer cheat sheet every backend module follows.
3. [plans/00-master-plan.md](plans/00-master-plan.md) — milestone sequencing across all services.

## Per-service deep dives

| # | Service | Plan | Key patterns |
|---|---------|------|--------------|
| 1 | User & Tenant | [01](plans/01-user-tenant-service.md) | Repository, JWT auth |
| 2 | Project & Client | [02](plans/02-project-client-service.md) | Aggregate, state machine |
| 3 | Data Ingestion | [03](plans/03-data-ingestion-service.md) | Adapter (OCR), Strategy (sources), async jobs |
| 4 | Catalog | [04](plans/04-catalog-service.md) | Specification + JSONB, normalization |
| 5 | Solar Calculation Engine | [05](plans/05-solar-calculation-engine.md) | Pure domain service, deterministic |
| 6 | Proposal Generator | [06](plans/06-proposal-generator-service.md) | **Builder + Criteria** (per brief) |
| 7 | Alerts | [07](plans/07-alerts-service.md) | **Strategy** (per brief), WebSocket push |
| 8 | Client Application | [08](plans/08-client-application.md) | React feature folders mirroring backend |

## Conventions

- Boundary rules: see [ARCHITECTURE §1.2](ARCHITECTURE.md#12-the-boundary-rules).
- Naming: see [CLEAN_ARCHITECTURE §3](CLEAN_ARCHITECTURE.md#3-naming-conventions).
- Event catalogue: see [ARCHITECTURE §4.1](ARCHITECTURE.md#41-published-events-initial-catalogue).
