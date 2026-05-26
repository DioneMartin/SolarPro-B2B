# Clean Architecture — Rules of the Road

> Operational rules. If [ARCHITECTURE.md](ARCHITECTURE.md) says *what*, this file says *how*.

---

## 1. The dependency rule (golden)

**Source code dependencies can only point inward.**

```
infrastructure  →  application  →  domain
       ↑                ↑              ↑
     (outer)         (middle)       (inner)
```

A class in `domain/` knows nothing about NestJS, TypeORM, HTTP, Redis, Google APIs, or any other framework. If a `domain/` file has `import { Injectable } from '@nestjs/common'`, the rule is broken.

---

## 2. Per-layer cheat sheet

### 2.1 `domain/`

**Contains:** entities, value objects, domain events, domain errors, repository **interfaces** (ports).

**Allowed imports:** other files in the same module's `domain/`. Period. Not even `shared/` — domain is the most pristine layer.

**Style rules:**
- Plain TypeScript classes. No `@Injectable`, no `@Entity`, no `@Column`.
- Entities have a private constructor + static factory (`Project.create(...)`, `Project.rehydrate(...)`) so invariants are enforced.
- Value objects are immutable (readonly fields, no setters). Equality by value.
- Domain events are POJO classes: `class ProjectApprovedEvent { constructor(readonly projectId: string, readonly tenantId: string, readonly at: Date) {} }`.
- Throw domain errors, not generic `Error`: `throw new ProjectNotApprovableError(...)`.

### 2.2 `application/`

**Contains:** use cases (one class = one use case), input/output DTOs, outbound ports (interfaces for external services), light orchestration services.

**Allowed imports:** own `domain/`, `shared/`. Never `infrastructure/`.

**Style rules:**
- One use case = one class with `execute(input: InputDto): Promise<OutputDto>`.
- Use cases are `@Injectable()` (we accept the framework decorator at this layer — see §4).
- Dependencies via **constructor injection of interfaces only** (`private readonly repo: ProjectRepository`).
- DTOs are dumb data carriers. Validation lives in `infrastructure/http` DTOs (class-validator); application DTOs are TypeScript types or simple classes.
- Use cases **don't catch infrastructure errors** unless they translate them into domain errors. Let infra errors propagate to the global filter.

### 2.3 `infrastructure/`

**Contains:** controllers, request/response DTOs (class-validator), TypeORM entities + mappers, repository implementations, external API adapters, the module's NestJS `@Module`.

**Allowed imports:** anything.

**Style rules:**
- Controllers are thin: parse → call use case → return. **No business logic.**
- TypeORM entities are separate from domain entities. **Always map.** Domain entity ≠ ORM entity. Mapper class lives next to the persistence implementation.
- One repository **interface** in `domain/repositories/`. One **implementation** in `infrastructure/persistence/` named `TypeOrm<Name>Repository`.
- External services: interface in `application/ports/`, implementation in `infrastructure/adapters/`. E.g. `OcrPort` interface, `GoogleVisionOcrAdapter` implementation.
- The module file wires it all up:
  ```ts
  providers: [
    CreateProjectUseCase,
    { provide: ProjectRepository, useClass: TypeOrmProjectRepository },
    { provide: OcrPort, useClass: GoogleVisionOcrAdapter },
  ]
  ```

---

## 3. Naming conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Domain entity | Noun | `Project`, `Client`, `Panel` |
| Value object | Noun | `Address`, `Money`, `KwhConsumption` |
| Repository interface | `<Entity>Repository` | `ProjectRepository` |
| Repository impl | `TypeOrm<Entity>Repository` | `TypeOrmProjectRepository` |
| Use case | `<Verb><Noun>UseCase` | `CreateProjectUseCase`, `GenerateProposalUseCase` |
| Use case input DTO | `<UseCaseName>Input` | `CreateProjectInput` |
| Outbound port | `<Capability>Port` | `OcrPort`, `SolarApiPort`, `PdfRendererPort` |
| Adapter | `<Provider><Capability>Adapter` | `GoogleSolarApiAdapter` |
| Domain event | `<Noun><PastTense>Event` | `ProjectApprovedEvent` |
| Controller | `<Noun>Controller` | `ProjectsController` |
| HTTP DTO | `<Verb><Noun>RequestDto` / `...ResponseDto` | `CreateProjectRequestDto` |

---

## 4. Pragmatic exceptions

Pure Clean Architecture says "no framework decorators anywhere but the outer layer." We bend two rules to keep the code readable:

1. **`@Injectable()` on use cases** — Nest's DI is the only way to avoid hand-wiring constructors. The decorator is metadata-only; it doesn't tie the use case to runtime Nest behaviour.
2. **Constructor `@Inject(TOKEN)` on interface ports** — TypeScript interfaces erase at runtime; we use a string/symbol token. Tokens are exported from `application/ports/`.

Everything else stays clean. In particular: **no framework imports in `domain/`, ever.**

---

## 5. Testing layers

| Layer | Test style | Mocks |
|-------|-----------|-------|
| `domain/` | Pure unit tests. Fast. No DI container. | None |
| `application/` | Unit tests with in-memory fakes of repositories and ports | In-memory fake classes (not jest mocks) |
| `infrastructure/` | Integration tests against real Postgres/Redis in Docker | Real services |

**Prefer in-memory fakes over `jest.fn()`** for repositories and ports — fakes catch bugs that mocks paper over.

---

## 6. Smell checklist (review-time)

If any of these are true in a PR, the PR is wrong:

- [ ] A `domain/` file imports `@nestjs/*` or `typeorm`.
- [ ] An `application/` file imports a TypeORM entity or HTTP DTO.
- [ ] A controller has an `if/else` that decides business outcomes.
- [ ] A use case calls `axios.get(...)` directly instead of going through a port.
- [ ] Domain entity has `@Entity()` (it should be a separate ORM entity + mapper).
- [ ] A use case is over 80 lines (split it; orchestrating multiple use cases is fine).
- [ ] Two modules' `domain/` folders import each other (cross-context coupling).
- [ ] A repository implementation queries another module's tables.
