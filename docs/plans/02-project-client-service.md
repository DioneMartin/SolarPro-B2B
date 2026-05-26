# 02 — Project & Client Service

> The "workspace" service. A Client has Projects; a Project aggregates everything the calculation engine and proposal generator need.

Folder: `backend/src/project-client/`

---

## Responsibilities

1. CRUD for `Client` (person or company).
2. CRUD for `Project` (belongs to a Client).
3. State machine: a Project moves through `DRAFT → READY_FOR_PROPOSAL → PROPOSED → APPROVED → INSTALLED`.
4. Dashboard query: list projects with their latest status, attached data summary.
5. Publish `project.approved` so the Alerts service can react.

**Out of scope:** the consumption/surface *data itself* (lives in data-ingestion, referenced by ID), proposals (separate service).

---

## Domain model

```
Client
  id: UUID
  tenantId: UUID
  kind: 'person' | 'company'
  displayName: string
  primaryAddress: Address       # VO
  contactEmail: Email
  contactPhone?: string
  notes?: string

Project
  id: UUID
  tenantId: UUID
  clientId: UUID                # FK Client (intra-module)
  name: string
  siteAddress: Address
  status: ProjectStatus
  energyDemandTargetPct: number # 0–100, "% of consumption to cover"
  consumptionRefId?: UUID       # opaque ref into data-ingestion
  surfaceRefId?: UUID           # opaque ref into data-ingestion
  selectedProposalId?: UUID     # opaque ref into proposal-generator
  createdAt, updatedAt
```

**Invariants:**
- `Project.status` transitions follow the state machine; illegal transitions throw `IllegalProjectTransitionError`.
- A Project cannot reach `READY_FOR_PROPOSAL` without both `consumptionRefId` and `surfaceRefId` set.
- A Project cannot be `APPROVED` without `selectedProposalId`.
- One Client can have many Projects (1-to-many). One Project belongs to exactly one Client.

**Why opaque refs (no FK to other modules):** see [ARCHITECTURE §1.2](../ARCHITECTURE.md#12-the-boundary-rules). The data-ingestion service owns its tables; we only carry the ID.

---

## Use cases

| Use case | Caller | Notes |
|----------|--------|-------|
| `CreateClientUseCase` | SolarConsultant | |
| `UpdateClientUseCase` | SolarConsultant | |
| `ListClientsUseCase` | SolarConsultant | Paginated, tenant-scoped |
| `CreateProjectUseCase` | SolarConsultant | Defaults to `DRAFT` |
| `AttachConsumptionUseCase` | SolarConsultant | Sets `consumptionRefId`; subscribed to `consumption.updated` event for late-binding |
| `AttachSurfaceUseCase` | SolarConsultant | Sets `surfaceRefId`; subscribed to `surface.updated` |
| `MarkReadyForProposalUseCase` | SolarConsultant | Validates invariants, transitions status |
| `SelectProposalUseCase` | SolarConsultant | Sets `selectedProposalId`, → `PROPOSED` |
| `ApproveProjectUseCase` | SolarConsultant | → `APPROVED`, publishes `project.approved` |
| `GetDashboardUseCase` | SolarConsultant | Lists tenant projects with status counts |

---

## State machine

```
        DRAFT  ──attach data──▶  READY_FOR_PROPOSAL
                                       │
                                       ▼
                                   PROPOSED  ──approve──▶ APPROVED ──install──▶ INSTALLED
```

Rules:
- Any state → `DRAFT` is **not** allowed (use a new project instead).
- `APPROVED` is terminal-ish — only `INSTALLED` follows.
- `selectProposal` is allowed from `READY_FOR_PROPOSAL` and from `PROPOSED` (replace selection).

---

## HTTP surface

```
POST   /clients                          # SOLAR_CONSULTANT
GET    /clients
GET    /clients/:id
PATCH  /clients/:id

POST   /clients/:clientId/projects       # SOLAR_CONSULTANT
GET    /projects                         # ?status=&clientId=
GET    /projects/:id
PATCH  /projects/:id
POST   /projects/:id/attach-consumption  # body: { consumptionRefId }
POST   /projects/:id/attach-surface
POST   /projects/:id/mark-ready
POST   /projects/:id/select-proposal     # body: { proposalId }
POST   /projects/:id/approve

GET    /dashboard                        # composite endpoint
```

---

## Events

**Published:**
| Event | Payload | When |
|-------|---------|------|
| `project.created` | `{ projectId, tenantId, clientId }` | create |
| `project.ready` | `{ projectId, tenantId }` | mark ready |
| `project.proposed` | `{ projectId, tenantId, proposalId }` | select proposal |
| `project.approved` | `{ projectId, tenantId, approvedAt, selectedProposalId }` | approve |

**Subscribed:**
| Event | Handler |
|-------|---------|
| `consumption.updated` | Refresh denormalized project status if needed |
| `surface.updated` | Same |

(These subscriptions exist mainly so a project that already has refs reflects updated *content* in the dashboard read model — they are not load-bearing.)

---

## Persistence

```sql
CREATE TABLE client (
  id           UUID PRIMARY KEY,
  tenant_id    UUID NOT NULL,
  kind         TEXT NOT NULL CHECK (kind IN ('person','company')),
  display_name TEXT NOT NULL,
  address      JSONB NOT NULL,           -- Address VO
  email        TEXT NOT NULL,
  phone        TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX client_tenant_idx ON client(tenant_id);

CREATE TABLE project (
  id                        UUID PRIMARY KEY,
  tenant_id                 UUID NOT NULL,
  client_id                 UUID NOT NULL REFERENCES client(id),
  name                      TEXT NOT NULL,
  site_address              JSONB NOT NULL,
  status                    TEXT NOT NULL,
  energy_demand_target_pct  INT NOT NULL CHECK (energy_demand_target_pct BETWEEN 0 AND 100),
  consumption_ref_id        UUID,
  surface_ref_id            UUID,
  selected_proposal_id      UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX project_tenant_idx ON project(tenant_id);
CREATE INDEX project_client_idx ON project(client_id);
CREATE INDEX project_status_idx ON project(tenant_id, status);
```

---

## Folder layout

```
project-client/
├─ domain/
│   ├─ entities/{client,project}.entity.ts
│   ├─ value-objects/{address,project-status}.vo.ts
│   ├─ errors/illegal-project-transition.error.ts
│   ├─ events/{project-created,project-approved,...}.event.ts
│   └─ repositories/{client,project}.repository.ts
├─ application/
│   ├─ use-cases/...          # one per row in the use-case table
│   ├─ event-handlers/        # consumption.updated, surface.updated
│   └─ dto/
└─ infrastructure/
    ├─ http/
    │   ├─ clients.controller.ts
    │   ├─ projects.controller.ts
    │   └─ dashboard.controller.ts
    ├─ persistence/...
    └─ project-client.module.ts
```

---

## Implementation order

1. Domain (Client, Project with state machine). Unit tests on every transition rule.
2. ORM + repos + migration.
3. CRUD use cases for Client.
4. CRUD use cases for Project (create + read).
5. Attach/transition use cases.
6. Event publisher integration; `project.approved` payload finalized.
7. Dashboard query.
8. Controllers + integration tests including cross-tenant 404 assertions.

---

## Open questions

- **Soft delete vs hard delete?** Use soft delete (`deleted_at`) on Client; cascade implications on Projects need a use case (`ArchiveClientUseCase`) — defer to v1.1.
- **Project ownership beyond "tenant"?** All consultants in a tenant can see all projects in v1. Per-consultant ownership is a v2 feature.
