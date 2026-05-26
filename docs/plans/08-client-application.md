# 08 — Client Application (Frontend)

> The React SPA. The **Client Application** node in the C4 diagram — the single surface every role uses. Not a Clean-Architecture project; uses a feature-folder layout that mirrors the backend modules.

Folder: `frontend/`

---

## Why no Clean Architecture on the frontend

Clean Architecture pays for itself on the backend because the domain has invariants, the persistence may change, and multiple delivery mechanisms (HTTP, events, scheduled jobs) hit the same logic. None of that applies to a CRUD-shaped UI. We'd be paying ceremony cost for no benefit.

What we **do** carry over:
- **Folder per bounded context** (mirrors `backend/src/*` so the same person can navigate either side).
- **API client per feature** (no god service).
- **Strong typing** at the API boundary — generated from the backend's OpenAPI.

---

## Folder layout

```
frontend/src/
├─ app/
│   ├─ App.tsx                  # router + providers
│   ├─ providers/               # QueryClient, AuthProvider, Toaster, WS provider
│   ├─ router.tsx
│   └─ layout/
│       ├─ AppShell.tsx         # sidebar + header
│       └─ AuthLayout.tsx       # login/signup wrapper
├─ features/
│   ├─ auth/                    # user-tenant frontend
│   │   ├─ api/                 # signup, login, me
│   │   ├─ components/
│   │   ├─ hooks/               # useAuth, useCurrentUser
│   │   └─ pages/
│   ├─ users/                   # tenant admin user management
│   ├─ clients/                 # project-client
│   ├─ projects/
│   ├─ ingestion/               # data-ingestion (consumption + surface)
│   ├─ catalog/                 # panels + inverters CRUD
│   ├─ proposals/               # builder UI + criteria + PDF
│   └─ alerts/                  # policies + live event toasts
├─ shared/
│   ├─ ui/                      # Button, Input, Card, Modal — UI kit wrappers
│   ├─ api/
│   │   ├─ client.ts            # axios instance + auth interceptor
│   │   └─ generated/           # OpenAPI-generated types & clients
│   ├─ auth/
│   │   ├─ AuthContext.tsx
│   │   └─ tokenStore.ts        # localStorage helper
│   ├─ ws/
│   │   └─ AlertsSocket.tsx     # connects to /alerts WS, dispatches to query cache
│   ├─ hooks/
│   ├─ utils/
│   └─ types/                   # mirrored from backend shared/types
├─ pages/                       # route-level components composing features
│   ├─ DashboardPage.tsx
│   ├─ ClientsPage.tsx
│   ├─ ClientDetailPage.tsx
│   ├─ ProjectDetailPage.tsx
│   ├─ CatalogPage.tsx
│   ├─ ProposalsPage.tsx
│   ├─ AlertsPage.tsx
│   ├─ LoginPage.tsx
│   ├─ SignupPage.tsx
│   └─ SettingsPage.tsx
├─ main.tsx
└─ index.css
```

---

## Tech choices

| Concern | Choice | Why |
|--------|--------|-----|
| Routing | **React Router v7** | Standard, mature, no router-as-framework lock-in |
| Server state | **TanStack Query** (React Query v5) | Caching, invalidation, polling — exactly what we need for proposals/alerts |
| Local state | **Zustand** | Tiny, no boilerplate, scales to a few stores |
| Forms | **React Hook Form** + **Zod** | Lightweight, schema-validated, plays with TypeScript |
| HTTP | **Axios** with interceptors | JWT injection, 401 → redirect |
| WebSocket | **socket.io-client** | Matches Nest's gateway choice |
| UI kit | **Mantine v8** (or shadcn/ui) | Pre-built form components, dark mode, no bespoke design system needed for v1 |
| Charts | **Recharts** | ROI projection chart in proposals |
| PDF preview | inline `<iframe>` of backend-rendered URL | No client-side PDF generation; backend owns truth |
| Tests | **Vitest** + **React Testing Library** + **MSW** (mock service worker) | Standard, fast |

---

## Auth flow

```
LoginPage → POST /auth/login → token + user
  ↓
tokenStore.set(token)
AuthContext.setUser(user)
  ↓
axios interceptor attaches `Authorization: Bearer <token>` on every request
  ↓
401 response → tokenStore.clear() → redirect to /login
```

`useAuth()` exposes `{ user, login, logout, isAuthenticated }`. Route guards consume it.

---

## Per-role navigation

```
TENANT_ADMIN       → Dashboard, Clients, Projects, Users, Catalog (view), Alerts, Settings
SOLAR_CONSULTANT   → Dashboard, Clients, Projects, Proposals, Alerts (own projects)
INVENTORY_MANAGER  → Catalog (CRUD), Settings
OPERATIONS         → Alerts (full), Projects (read), Dashboard
```

Implemented as a `<RoleGate roles={['TENANT_ADMIN']}>...</RoleGate>` component and conditional sidebar entries. Server still enforces role on every endpoint — the frontend gate is UX only.

---

## Pages × features map

| Page | Composes |
|------|----------|
| `DashboardPage` | `projects` (status counts), `alerts` (recent unack) |
| `ClientsPage` | `clients` list + create modal |
| `ClientDetailPage` | `clients` detail, `projects` for that client, create-project modal |
| `ProjectDetailPage` | `projects` detail, `ingestion` (upload bill + surface lookup + edit), `proposals` (list + generate), `alerts` (per-project policies) |
| `CatalogPage` | `catalog` panels & inverters tabs, alias config sub-page |
| `ProposalsPage` | `proposals` index across projects (filter by status) |
| `AlertsPage` | `alerts` events feed + acknowledge action |
| `SettingsPage` (admin) | `users` (create/disable), tenant info |

---

## The proposal builder UI (notable)

Maps the backend's [Builder + Criteria patterns](06-proposal-generator-service.md) into a guided form:

```
┌───────────────────────────────────────────────────────────┐
│ Generate proposal for project "X"                         │
│                                                           │
│ Coverage target ........ [80] %                           │
│ Horizon ............... [20] years                        │
│ Energy inflation ...... [4]  %/yr                         │
│ Discount rate ......... [6]  %  (optional)                │
│                                                           │
│ Filters                                                   │
│  [✓] Must fit available surface                           │
│  [✓] Must meet coverage target                            │
│  [ ] Restrict to brand: [           ▼]                    │
│  [ ] Price range: [   ] to [   ]                          │
│                                                           │
│ Optimize for                                              │
│  ( ) Lowest cost                                          │
│  (●) Lowest ROI                                           │
│  ( ) Shortest payback                                     │
│  ( ) Highest ROI                                          │
│                                                           │
│                                          [Generate ▶]    │
└───────────────────────────────────────────────────────────┘
```

The form serializes to the JSON shape documented in [the proposal generator plan](06-proposal-generator-service.md#use-cases) and POSTs.

Result view = a **table of raw candidates** (the filtered set) with the **optimal row highlighted**, plus a ROI chart for the optimal pick. "Export PDF" hits `POST /proposals/:id/export` and shows the result inline.

---

## Live alerts

`AlertsSocket` is mounted once at app shell. On `alert.triggered`:
1. Toast pops with `severity` styling.
2. Header bell badge increments.
3. `queryClient.invalidateQueries(['alerts', 'events'])` so the Alerts page is fresh.

If the WS disconnects, fall back to polling every 60s.

---

## Implementation order

1. **Bootstrap**: deps install, Mantine theme, React Router, QueryClient provider, axios client + 401 interceptor.
2. **Auth**: AuthContext, login/signup pages, token store. Smoke test full login flow.
3. **Layout shell**: AppShell with role-aware sidebar.
4. **Clients + Projects**: lists, detail pages, create modals. (Mirror backend M2.)
5. **Ingestion**: upload bill (multipart), manual entry, surface lookup with map preview if cheap.
6. **Catalog**: CRUD for panels & inverters with JSON spec editor + alias config screen.
7. **Proposals**: builder form, results table, ROI chart, PDF export.
8. **Alerts**: policies CRUD, events feed, WebSocket toasts.
9. **Settings**: users CRUD.
10. **Polish**: empty states, loading skeletons, error boundaries, dark mode toggle.

---

## OpenAPI client generation

Backend exposes `/docs-json` via `@nestjs/swagger`. Frontend has an `npm run gen:api` script that runs `openapi-typescript-codegen` (or similar) outputting to `shared/api/generated/`. Run on demand; commit the output so frontend devs don't need the backend running to type-check.

---

## Open questions

- **Internationalization?** v1: English-only; Spanish in v1.1 since the team is in Mexico.
- **Map preview for surface?** Nice-to-have. If we have Google Maps API access (we do, via the Solar API key) embed a static map. Else just show coordinates.
- **PDF inline preview vs download only?** Both: `<iframe>` if browser supports, "Download" button always.
- **Print-friendly proposal page** in addition to PDF? Skip — the PDF is the artifact.
