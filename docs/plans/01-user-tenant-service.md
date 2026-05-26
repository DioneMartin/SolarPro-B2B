# 01 — User & Tenant Service

> Bounded context that owns identity, multitenancy, and authorization. **Every other service depends on the JWT it issues.**

Folder: `backend/src/user-tenant/`

---

## Responsibilities

1. Create tenants (signup → bootstraps the first TenantAdmin).
2. Manage users inside a tenant (only `TenantAdmin` can create).
3. Authenticate (email + password → JWT).
4. Expose `Tenant` and `User` lookup *ports* for other modules' joins (read-only).

**Out of scope:** invoicing, password reset emails (deferred), social login.

---

## Domain model

```
Tenant
  id: UUID
  name: string
  slug: string                  # unique, URL-safe
  status: 'active' | 'suspended'
  createdAt: Date

User
  id: UUID
  tenantId: UUID                # FK Tenant.id (only intra-module FK allowed)
  email: Email                  # VO, unique within tenant
  passwordHash: string
  fullName: string
  role: Role                    # TENANT_ADMIN | SOLAR_CONSULTANT | INVENTORY_MANAGER | OPERATIONS
  status: 'active' | 'disabled'
  createdAt: Date
```

**Invariants:**
- A tenant always has ≥1 active TenantAdmin. Use cases that disable/delete the last admin must throw `LastAdminError`.
- `email` is unique **per tenant** (not globally) — two tenants can have the same email.
- A non-TenantAdmin user **cannot** create another user.

**Value objects:**
- `Email` — validates format, normalizes to lowercase.
- `Role` — enum-like VO with helpers `Role.canManageUsers()`.

---

## Use cases

| Use case | Caller | Notes |
|----------|--------|-------|
| `SignupTenantUseCase` | public | Atomic: creates Tenant + first TenantAdmin user |
| `LoginUseCase` | public | Returns `{ accessToken, user }` |
| `CreateUserUseCase` | TenantAdmin | Hashes password (bcrypt), publishes `user.created` |
| `ListUsersUseCase` | TenantAdmin | Tenant-scoped via interceptor |
| `DisableUserUseCase` | TenantAdmin | Guards `LastAdminError` |
| `UpdateUserRoleUseCase` | TenantAdmin | Same guard |
| `GetMeUseCase` | any authenticated | Returns the user from JWT claims |

---

## HTTP surface

```
POST   /auth/signup              # public — creates tenant + admin
POST   /auth/login               # public
GET    /auth/me                  # authenticated

POST   /users                    # TENANT_ADMIN
GET    /users                    # TENANT_ADMIN
PATCH  /users/:id/role           # TENANT_ADMIN
PATCH  /users/:id/disable        # TENANT_ADMIN
```

`/health` lives in `app.controller.ts` (foundation), not here.

---

## Outbound ports

This service has **no outbound ports** — it doesn't call other services. It only *publishes* events.

---

## Events

| Event | Payload | Published when |
|-------|---------|----------------|
| `tenant.created` | `{ tenantId, slug, createdAt }` | Signup completes |
| `user.created` | `{ userId, tenantId, role, createdAt }` | Any user created |
| `user.disabled` | `{ userId, tenantId, at }` | Disable use case |

---

## Persistence (PostgreSQL)

```sql
CREATE TABLE tenant (
  id          UUID PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  status      TEXT NOT NULL CHECK (status IN ('active','suspended')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE app_user (                 -- "user" is reserved in PG
  id            UUID PRIMARY KEY,
  tenant_id     UUID NOT NULL REFERENCES tenant(id),
  email         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL,
  status        TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

CREATE INDEX app_user_tenant_idx ON app_user(tenant_id);
```

`Tenant` is the **only** entity in the whole system with no `tenant_id` of its own (it *is* the tenant).

---

## Folder layout

```
user-tenant/
├─ domain/
│   ├─ entities/
│   │   ├─ tenant.entity.ts
│   │   └─ user.entity.ts
│   ├─ value-objects/
│   │   ├─ email.vo.ts
│   │   └─ role.vo.ts
│   ├─ errors/
│   │   ├─ last-admin.error.ts
│   │   ├─ duplicate-email.error.ts
│   │   └─ invalid-credentials.error.ts
│   ├─ events/
│   │   ├─ tenant-created.event.ts
│   │   └─ user-created.event.ts
│   └─ repositories/
│       ├─ tenant.repository.ts        # interface
│       └─ user.repository.ts          # interface
├─ application/
│   ├─ use-cases/
│   │   ├─ signup-tenant.use-case.ts
│   │   ├─ login.use-case.ts
│   │   ├─ create-user.use-case.ts
│   │   ├─ list-users.use-case.ts
│   │   ├─ disable-user.use-case.ts
│   │   ├─ update-user-role.use-case.ts
│   │   └─ get-me.use-case.ts
│   ├─ ports/
│   │   ├─ password-hasher.port.ts     # interface (bcrypt impl in infra)
│   │   └─ token-signer.port.ts        # interface (jwt impl in infra)
│   └─ dto/
│       ├─ signup-tenant.input.ts
│       ├─ login.input.ts
│       └─ create-user.input.ts
└─ infrastructure/
    ├─ http/
    │   ├─ auth.controller.ts
    │   ├─ users.controller.ts
    │   └─ dto/                        # class-validator request DTOs
    ├─ persistence/
    │   ├─ tenant.orm-entity.ts
    │   ├─ user.orm-entity.ts
    │   ├─ tenant.mapper.ts
    │   ├─ user.mapper.ts
    │   ├─ typeorm-tenant.repository.ts
    │   └─ typeorm-user.repository.ts
    ├─ adapters/
    │   ├─ bcrypt-password-hasher.adapter.ts
    │   └─ jwt-token-signer.adapter.ts
    └─ user-tenant.module.ts
```

---

## Implementation order

1. Domain entities + value objects + repo interfaces. Unit tests on invariants.
2. ORM entities, mappers, TypeORM repositories. Integration test against real Postgres.
3. `PasswordHasherPort` + bcrypt adapter; `TokenSignerPort` + JWT adapter.
4. Use cases with in-memory repo fakes. Unit tests cover happy + failure paths.
5. Controllers + DTOs. End-to-end test: signup → login → create user → login as new user.
6. Wire into `app.module.ts`. Bake JWT guard into the global pipeline so every other module gets auth + tenant scope for free.

---

## Open questions

- **Password policy** — Min 12 chars, no other rules in v1. Validation in HTTP DTO via class-validator.
- **Token TTL** — 8 hours. No refresh tokens in v1 (re-login). Refresh added in v2 if friction shows.
- **Audit log** — Out of scope; we have `user.created` / `user.disabled` events that an auditor service can later subscribe to.
