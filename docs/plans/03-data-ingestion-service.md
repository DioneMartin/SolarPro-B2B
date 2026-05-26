# 03 — Data Ingestion Service

> Two distinct ingestion pipelines feed a Project: **historical consumption** (manual or OCR from a PDF bill) and **roof surface + irradiation** (Google Solar API, editable).

Folder: `backend/src/data-ingestion/`

---

## Responsibilities

1. Accept consumption data via **three sources**: manual entry, OCR-on-PDF, OCR-on-image.
2. Query the **Google Solar API** by address/coordinates for irradiation + roof surface estimate.
3. Persist both as ingestion records *referenced by Project*.
4. Allow the consultant to **edit** any ingested value (especially surface — physical inspection overrides API).
5. Publish `consumption.updated` and `surface.updated` events so the calculation engine reacts.

**Out of scope:** the calculation itself; storing files long-term (we keep PDFs only until OCR completes, then drop unless flagged).

---

## Two ingestion pipelines

### 3.1 Consumption ingestion

```
┌─────────────────────────────┐
│ POST /consumption/manual    │── direct insert
└─────────────────────────────┘
┌─────────────────────────────┐
│ POST /consumption/upload    │── OCR (Strategy)
│        (PDF or image)       │     │
│                             │     ▼
│                             │   Tesseract │ GoogleVision │ AwsTextract
│                             │     │
│                             │     ▼
│                             │   parser →  ConsumptionRecord
└─────────────────────────────┘
```

**Strategy: `OcrPort`** — interface with one impl per provider. Default impl: `GoogleVisionOcrAdapter` (better quality on photos of bills than self-hosted Tesseract; cheaper than Textract for our volume). Tesseract impl kept as the dev/offline fallback.

**Parser** is a domain service: takes raw OCR text + a tenant-configurable hint set (utility company → regex/keyword profile) and emits an array of `MonthlyKwh`. The parser is the value-add; the OCR is commodity.

### 3.2 Surface ingestion

```
┌─────────────────────────────────┐
│ POST /surface/lookup            │── SolarApiPort
│   body: { address | coords }    │     │
└─────────────────────────────────┘     ▼
                              GoogleSolarApiAdapter
                                        │
                                        ▼
                                buildingInsights →
                                SurfaceRecord (editable)
```

The `SurfaceRecord` is **editable** via `PATCH /surface/:id`. Editing publishes a fresh `surface.updated` event so the calculation engine recomputes.

API key: `AIzaSyBB5DBuzag8L6JZLP04qq2YVkk7PpwEKbg` — **stored in `.env`, never committed.** Add to `.env.example` as a placeholder.

---

## Domain model

```
ConsumptionRecord
  id: UUID
  tenantId: UUID
  projectId: UUID
  source: 'MANUAL' | 'OCR_PDF' | 'OCR_IMAGE'
  rawFileRef?: string                  # blob storage key (if uploaded)
  tariff?: { currency, pricePerKwh, fixedFee? }
  months: MonthlyKwh[]                 # 12 months expected, accept partial
  notes?: string
  createdAt, updatedAt

MonthlyKwh (VO)
  year: number
  month: 1..12
  kwh: number  >= 0

SurfaceRecord
  id: UUID
  tenantId: UUID
  projectId: UUID
  inputAddress?: string
  coordinates: { lat, lon }
  rawApiResponse: jsonb                # for audit / re-derivation
  estimatedUsableSqMeters: number      # editable
  annualIrradiationKwhPerSqM: number   # from API
  manualOverride: boolean              # true if user edited usable area
  createdAt, updatedAt
```

**Invariants:**
- A `ConsumptionRecord` is only valid if it has ≥3 months of data (calculation will average; <3 is too noisy).
- A `SurfaceRecord` always has coordinates; address is optional but at least one of (address, coords) was provided.
- Editing `estimatedUsableSqMeters` sets `manualOverride=true`. The calculation engine logs this provenance in proposals.

---

## Use cases

| Use case | Caller | Notes |
|----------|--------|-------|
| `RecordManualConsumptionUseCase` | SolarConsultant | |
| `UploadAndExtractConsumptionUseCase` | SolarConsultant | Enqueues OCR job; returns 202 + record in `PENDING` |
| `UpdateConsumptionUseCase` | SolarConsultant | Edit any month |
| `LookupSurfaceUseCase` | SolarConsultant | Calls SolarApiPort |
| `OverrideSurfaceUseCase` | SolarConsultant | Edits usable sq m |
| `GetConsumptionUseCase` | any role within tenant | |
| `GetSurfaceUseCase` | any role within tenant | |

---

## Async OCR processing

Don't block the HTTP request on Vision API latency. Use **BullMQ** (Redis-backed queue):

```
POST /consumption/upload
   → save file to disk/S3, create ConsumptionRecord(status=PENDING)
   → enqueue OcrJob{ recordId, fileRef }
   → return 202 { recordId }

OcrWorker.process(job):
   text = await ocrPort.extract(fileRef)
   parsed = parser.parse(text, tenantHints)
   record.fill(parsed); record.status = READY
   repo.save(record)
   eventBus.publish('consumption.updated', { recordId, projectId, tenantId })
```

The frontend polls `GET /consumption/:id` or subscribes to a WS notification. (WS push for ingestion completion is a v1.1 enhancement; v1 polls.)

---

## HTTP surface

```
# Consumption
POST   /projects/:projectId/consumption/manual
POST   /projects/:projectId/consumption/upload         # multipart/form-data
GET    /consumption/:id
PATCH  /consumption/:id

# Surface
POST   /projects/:projectId/surface/lookup             # body: address or coords
GET    /surface/:id
PATCH  /surface/:id                                    # override usable sq m
```

---

## Outbound ports

```
OcrPort
  extract(fileRef: string, mime: 'pdf' | 'image'): Promise<string>

SolarApiPort
  buildingInsights(input: { address?: string; coords?: LatLon }): Promise<{
    coords: LatLon
    annualIrradiationKwhPerSqM: number
    estimatedUsableSqMeters: number
    raw: unknown
  }>

BlobStoragePort
  save(file: Buffer, mime: string): Promise<string>   # returns key
  read(key: string): Promise<Buffer>
  delete(key: string): Promise<void>
```

Adapters (in `infrastructure/adapters/`):
- `GoogleVisionOcrAdapter`, `TesseractOcrAdapter`
- `GoogleSolarApiAdapter` — wraps the [buildingInsights](https://developers.google.com/maps/documentation/solar/building-insights) endpoint
- `LocalFsBlobStorageAdapter` for dev, `S3BlobStorageAdapter` later

---

## Events

| Event | Payload | When |
|-------|---------|------|
| `consumption.updated` | `{ recordId, projectId, tenantId, months: MonthlyKwh[] }` | After insert, edit, or OCR completion |
| `surface.updated` | `{ recordId, projectId, tenantId, usableSqMeters, annualIrradiation }` | After insert or edit |

---

## Persistence

```sql
CREATE TABLE consumption_record (
  id            UUID PRIMARY KEY,
  tenant_id     UUID NOT NULL,
  project_id    UUID NOT NULL,
  source        TEXT NOT NULL,
  status        TEXT NOT NULL,                -- PENDING|READY|FAILED
  raw_file_ref  TEXT,
  tariff        JSONB,
  months        JSONB NOT NULL,               -- MonthlyKwh[]
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE surface_record (
  id                          UUID PRIMARY KEY,
  tenant_id                   UUID NOT NULL,
  project_id                  UUID NOT NULL,
  input_address               TEXT,
  coordinates                 JSONB NOT NULL,
  raw_api_response            JSONB NOT NULL,
  estimated_usable_sqm        NUMERIC NOT NULL,
  annual_irradiation_kwh_sqm  NUMERIC NOT NULL,
  manual_override             BOOLEAN NOT NULL DEFAULT false,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Cache table for Google Solar responses (avoid re-charging the quota):

```sql
CREATE TABLE solar_api_cache (
  address_hash TEXT PRIMARY KEY,
  response     JSONB NOT NULL,
  fetched_at   TIMESTAMPTZ NOT NULL
);
```

`address_hash = sha256(normalized(address))`. TTL: 30 days (the building doesn't move).

---

## Folder layout

```
data-ingestion/
├─ domain/
│   ├─ entities/{consumption-record,surface-record}.entity.ts
│   ├─ value-objects/{monthly-kwh,lat-lon,tariff}.vo.ts
│   ├─ services/utility-bill-parser.ts        # pure parser
│   └─ repositories/...
├─ application/
│   ├─ use-cases/...
│   ├─ ports/{ocr,solar-api,blob-storage}.port.ts
│   ├─ jobs/ocr.processor.ts                  # BullMQ worker
│   └─ event-handlers/                        # none initially
└─ infrastructure/
    ├─ http/
    │   ├─ consumption.controller.ts
    │   └─ surface.controller.ts
    ├─ persistence/...
    ├─ adapters/
    │   ├─ google-vision-ocr.adapter.ts
    │   ├─ tesseract-ocr.adapter.ts
    │   ├─ google-solar-api.adapter.ts
    │   └─ local-fs-blob-storage.adapter.ts
    └─ data-ingestion.module.ts
```

---

## Implementation order

1. Manual consumption use case + persistence (no OCR yet) — unblocks calc engine devs immediately.
2. Surface lookup with `GoogleSolarApiAdapter` (real API) + cache table.
3. Surface override use case.
4. Blob storage adapter (local FS).
5. OCR pipeline: BullMQ wiring, Tesseract adapter (dev), parser, end-to-end test with a sample PDF.
6. Google Vision adapter (env-toggle to switch).
7. Edit consumption use case.
8. Controllers, DTO validation, integration tests.

---

## Open questions

- **PDF page limit / image size limit?** Reject >5 MB or >10 pages at the controller.
- **Tariff extraction reliability?** Mark as best-effort, surface a "please verify" badge in the UI.
- **Mexico-specific utility profiles (CFE)?** Build a profile system; ship one profile (CFE) in v1, design lets others be added.
