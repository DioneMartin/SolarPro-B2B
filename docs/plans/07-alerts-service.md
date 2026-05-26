# 07 — Alerts Service

> Post-installation monitoring. Once a project is **approved**, the alert service can be configured to push notifications based on **time-based** maintenance schedules and/or **weather-based** thresholds.

Folder: `backend/src/alerts/`

---

## What the brief requires

> *This would follow the Strategy Pattern. Once a project is approved, it can be set to send alerts based on time (following the specific maintenance schedules of the installed panels) or based on the weather. For the latter strategy, we rely on using the Air Quality API, Weather API, Pollen API… once a threshold is exceeded, a notification is sent to the client application.*

Strategy is exactly the right pattern here: the *evaluation algorithm* changes (cron schedule vs external API + thresholds) but the *interface* (evaluate → emit alerts) is identical.

---

## Pattern — Strategy

```ts
// domain/strategies/alert-strategy.ts

export interface AlertStrategy {
  readonly kind: 'TIME_BASED' | 'WEATHER_BASED'
  evaluate(policy: AlertPolicy, ctx: EvaluationContext): Promise<AlertEvent[]>
}
```

Two concrete strategies (more can be added without touching the dispatcher):

```ts
TimeBasedAlertStrategy
  ─ evaluates the maintenance schedule (e.g. quarterly cleaning, annual inverter check)
  ─ emits an alert when `now >= nextDueDate`

WeatherBasedAlertStrategy
  ─ fans out to WeatherApiPort, AirQualityApiPort, PollenApiPort
  ─ compares readings against policy.thresholds
  ─ emits an alert when any threshold exceeded
```

A scheduler (`AlertEvaluator`) iterates active policies and dispatches to the matching strategy. The scheduler doesn't know what either strategy does — it only knows the interface.

---

## Domain model

```
AlertPolicy
  id: UUID
  tenantId: UUID
  projectId: UUID
  strategyKind: 'TIME_BASED' | 'WEATHER_BASED'
  config: jsonb                         # strategy-specific (typed below)
  enabled: boolean
  createdAt, updatedAt

AlertEvent
  id: UUID
  tenantId: UUID
  policyId: UUID
  projectId: UUID
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  title: string
  body: string
  payload: jsonb                        # contextual data (sensor readings, schedule item)
  triggeredAt: Date
  acknowledgedAt?: Date
  acknowledgedBy?: UUID                 # userId
```

### Strategy configs

```ts
// time-based
{
  schedule: [
    { kind: 'PANEL_CLEANING', cron: '0 9 1 */3 *', leadDays: 7 },   // quarterly
    { kind: 'INVERTER_CHECK', cron: '0 9 1 1 *',  leadDays: 14 }    // annual
  ]
}

// weather-based
{
  coords: { lat, lon },
  thresholds: {
    aqiAbove?: number          // air quality (PM2.5 fouls panels)
    pollenAbove?: number       // similar
    windGustKmhAbove?: number  // structural risk
    rainMmInDayAbove?: number  // wash-needed indicator (counter-intuitive but useful)
    snowExpected?: boolean
  },
  pollIntervalMinutes: 60
}
```

**Invariant:** an `AlertPolicy` for a Project can only be created if `project.status === 'APPROVED'`. Enforced by subscribing to `project.approved` *or* by validating in the use case (we do both: subscribe to auto-create a default policy; allow manual create as a use case that re-checks status).

---

## The evaluator (orchestrator, not a strategy)

```ts
@Injectable()
export class AlertEvaluator {
  constructor(
    private readonly strategies: Map<string, AlertStrategy>,    // registry
    private readonly policies: AlertPolicyRepository,
    private readonly events: AlertEventRepository,
    private readonly bus: EventBus,
  ) {}

  @Cron('0 */15 * * * *')  // every 15 minutes
  async tick() {
    const active = await this.policies.listEnabled()
    for (const policy of active) {
      const strategy = this.strategies.get(policy.strategyKind)
      const ctx = { now: new Date() }
      const events = await strategy.evaluate(policy, ctx)
      for (const e of events) {
        await this.events.save(e)
        await this.bus.publish('alert.triggered', e)
      }
    }
  }
}
```

The cron lives in `infrastructure/scheduling/`. Strategies live in `domain/strategies/`. The evaluator lives in `application/services/` and uses a strategy *registry* injected at module-wire time.

---

## Adding a new strategy

1. Implement `AlertStrategy` in `domain/strategies/`.
2. Register it in `alerts.module.ts` providers.
3. Done. The evaluator picks it up by `kind`.

No `switch (policy.kind)` anywhere — that's the whole point of strategy here.

---

## Use cases

| Use case | Caller | Notes |
|----------|--------|-------|
| `CreateAlertPolicyUseCase` | SolarConsultant or Operations | Validates `project.status === APPROVED` |
| `UpdateAlertPolicyUseCase` | Operations | |
| `EnableDisableAlertPolicyUseCase` | Operations | |
| `ListPoliciesUseCase` | any tenant role | |
| `ListAlertEventsUseCase` | Operations | Paginated, filter by severity / acknowledged |
| `AcknowledgeAlertEventUseCase` | Operations | Sets `acknowledgedAt` |

Plus the auto-handler:

| Subscriber | Reacts to | Action |
|-----------|-----------|--------|
| `OnProjectApprovedHandler` | `project.approved` | Creates a default `TIME_BASED` policy with sensible defaults |

---

## Outbound ports

```
WeatherApiPort
  current(coords: LatLon): Promise<{ windGustKmh, rainMmLast24h, snowForecastNext24h: boolean, ... }>

AirQualityApiPort
  current(coords: LatLon): Promise<{ aqi, pm25, pm10 }>

PollenApiPort
  current(coords: LatLon): Promise<{ index, dominantTaxon }>

NotificationPort
  push(tenantId: string, event: AlertEvent): Promise<void>
```

Adapters: `OpenWeatherWeatherAdapter` (or Google Weather API), `IqAirAirQualityAdapter` (or Google Air Quality API per the brief), `GooglePollenAdapter`, `WebSocketNotificationAdapter`.

---

## WebSocket push to frontend

```
@WebSocketGateway({ namespace: '/alerts' })
class AlertsGateway {
  // client connects with JWT; we put the socket in a room keyed by tenantId
  // on 'alert.triggered' event from bus → emit to room
}
```

The frontend ([client app plan](08-client-application.md)) maintains one socket while a user is logged in. Disconnections fall back to polling `GET /alerts?since=...`.

---

## Events

| Event | Payload | Direction |
|-------|---------|-----------|
| `project.approved` | (from project-client) | **Subscribed** — auto-creates default policy |
| `alert.triggered` | `{ eventId, tenantId, projectId, severity, title, body, triggeredAt }` | **Published** — WebSocket gateway re-emits to clients |
| `alert.acknowledged` | `{ eventId, userId, acknowledgedAt }` | Published — audit only |

---

## HTTP surface

```
POST   /alerts/policies                  # SOLAR_CONSULTANT or OPERATIONS
GET    /alerts/policies                  # ?projectId=
PATCH  /alerts/policies/:id
POST   /alerts/policies/:id/enable
POST   /alerts/policies/:id/disable

GET    /alerts/events                    # ?severity=&acknowledged=&since=
POST   /alerts/events/:id/acknowledge

# WebSocket
WS     /alerts                           # namespace; auth via JWT in handshake
```

---

## Persistence

```sql
CREATE TABLE alert_policy (
  id            UUID PRIMARY KEY,
  tenant_id     UUID NOT NULL,
  project_id    UUID NOT NULL,
  strategy_kind TEXT NOT NULL,
  config        JSONB NOT NULL,
  enabled       BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX alert_policy_tenant_enabled_idx ON alert_policy(tenant_id, enabled);

CREATE TABLE alert_event (
  id               UUID PRIMARY KEY,
  tenant_id        UUID NOT NULL,
  policy_id        UUID NOT NULL REFERENCES alert_policy(id),
  project_id       UUID NOT NULL,
  severity         TEXT NOT NULL,
  title            TEXT NOT NULL,
  body             TEXT NOT NULL,
  payload          JSONB NOT NULL,
  triggered_at     TIMESTAMPTZ NOT NULL,
  acknowledged_at  TIMESTAMPTZ,
  acknowledged_by  UUID
);
CREATE INDEX alert_event_tenant_unack_idx ON alert_event(tenant_id) WHERE acknowledged_at IS NULL;
```

**Idempotency:** time-based strategies must not re-emit the same maintenance event every 15 minutes. The strategy keeps a watermark (`lastEmittedFor` per schedule item) inside the policy's `config`, or queries `alert_event` for an existing emission in the current period before emitting. Pick the second approach — DB is the source of truth.

---

## Folder layout

```
alerts/
├─ domain/
│   ├─ entities/{alert-policy,alert-event}.entity.ts
│   ├─ strategies/
│   │   ├─ alert-strategy.ts            # interface
│   │   ├─ time-based-alert.strategy.ts
│   │   └─ weather-based-alert.strategy.ts
│   ├─ errors/{policy-not-allowed,unknown-strategy}.error.ts
│   └─ repositories/...
├─ application/
│   ├─ use-cases/...
│   ├─ event-handlers/on-project-approved.handler.ts
│   ├─ services/alert-evaluator.ts
│   ├─ ports/
│   │   ├─ weather-api.port.ts
│   │   ├─ air-quality-api.port.ts
│   │   ├─ pollen-api.port.ts
│   │   └─ notification.port.ts
│   └─ dto/
└─ infrastructure/
    ├─ http/{policies,events}.controller.ts
    ├─ websocket/alerts.gateway.ts
    ├─ scheduling/alert-cron.ts         # wraps AlertEvaluator with @Cron
    ├─ persistence/...
    ├─ adapters/
    │   ├─ open-weather.adapter.ts
    │   ├─ google-air-quality.adapter.ts
    │   ├─ google-pollen.adapter.ts
    │   └─ websocket-notification.adapter.ts
    └─ alerts.module.ts
```

---

## Implementation order

1. Domain: AlertStrategy interface, AlertPolicy, AlertEvent entities. Heavy unit tests on idempotency.
2. ORM + migrations.
3. TimeBasedAlertStrategy with cron-parser, idempotency via DB lookup.
4. AlertEvaluator + `@nestjs/schedule` cron tick.
5. Subscribe to `project.approved` → auto-create default policy.
6. CRUD use cases + controllers.
7. Weather/AirQuality/Pollen ports + adapters + WeatherBasedAlertStrategy.
8. WebSocket gateway + NotificationAdapter publishing to bus → frontend.
9. Integration tests with fake clock, fake weather adapter.

---

## Open questions

- **Per-tenant API keys** for weather services or shared? v1: shared (one key in env), rate-limited; tenants can override in v1.1.
- **Persistent vs ephemeral alert events?** Persist; the operations dashboard needs history.
- **Email/SMS push?** v2; v1 = WebSocket toast only.
- **Backfill alerts on policy change?** No — policies are forward-looking.
