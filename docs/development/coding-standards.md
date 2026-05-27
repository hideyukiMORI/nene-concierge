# Coding Standards

NeNe Concierge follows NENE2 coding standards with product-specific additions.

## PHP

- PHP `>=8.4.1 <9.0`
- `declare(strict_types=1)` in every PHP file
- PSR-12 formatting (enforced by PHP CS-Fixer)
- `final readonly` classes preferred for value objects and DTOs
- No large file-level copyright banners

### Architecture

```
Handler → UseCase → RepositoryInterface → PdoRepository
         ↓
     ActionDispatcher → ActionAdapterInterface → SlackAdapter / ChatworkAdapter / EmailAdapter / HttpAdapter
```

- **Handlers**: thin — parse HTTP input, build DTOs, call use cases, return JSON responses
- **UseCases**: business logic and orchestration — no `$_SERVER`, no PDO, no raw HTTP clients
- **Repositories**: SQL and persistence only
- **Action adapters**: external service calls (email, Slack, Chatwork, HTTP) — one class per adapter type

### Module structure (`src/`)

Organize by **domain**, not by layer:

```
src/
  ApplicationServiceProvider.php
  Http/               # Front controller and container factory
  AdminAuth/          # JWT Bearer operator auth
  Scenario/           # Scenario CRUD, versioning, publish lifecycle
  Node/               # Node and edge definitions and validation
  Engine/             # Scenario execution state machine
  Session/            # Visitor session management
  Message/            # Session message history
  Action/             # Action dispatcher + typed adapters
  Appearance/         # Widget appearance settings
  Upstream/           # HTTP clients for NeNe Records / NeNe Corpus (Phase 6)
  Install/            # Web installer (Tier A)
```

Do not create a flat `Controllers/`, `Services/`, or `Repositories/` top-level folder.

### Key rules

- Use `readonly` properties and immutable DTOs at use case input boundaries.
- Use `interface` at infrastructure boundaries to reduce coupling.
- Constructor injection; no service locator pattern in domain or use case code.
- Typed config objects — no raw `getenv()` / `$_ENV` outside `ConfigLoader`.
- PHPDoc only on public API, interfaces, extension points, and middleware.

## TypeScript / React (frontend)

- React 19 + TypeScript strict mode
- Vite as the build tool
- TailwindCSS v4 for styling
- No `any` types in new code
- API client in `frontend/src/api/` — typed fetch wrappers
- Component files: PascalCase; utility files: camelCase

## Testing

- Use case and domain unit tests: SQLite in-memory, no real HTTP
- HTTP contract tests for public API endpoints
- Tests must be deterministic and independent

## Error handling

- User-facing JSON errors: RFC 9457 Problem Details (`application/problem+json`)
- Problem Details `type` pattern: `https://nene-concierge.dev/problems/{problem-name}`
- No stack traces, SQL, file paths, or credentials in public responses
- Validation failures: `validation-failed` Problem Details with structured `errors` array (HTTP 422)

## Database

- MySQL (Tier A production) and SQLite (tests and Tier B dev)
- Migrations: `database/migrations/`, seeds: `database/seeds/`
- Migration tool: Phinx
- No raw DB access outside Repository classes
