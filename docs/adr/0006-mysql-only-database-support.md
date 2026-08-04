# ADR 0006: MySQL Only — Withdrawing SQLite Compatibility

## Status

accepted

Supersedes the SQLite-compatibility items of **ADR 0003** (`## Consequences` → *Costs*:
"Must validate MySQL and SQLite compatibility in tests.") and **ADR 0004**
(`## Consequences` → *Benefits*: "Row-level isolation is MySQL / SQLite compatible
(Tier A + Tier B dev).").

Both ADRs remain accepted in every other respect. Only the SQLite claims are withdrawn.

## Context

### Why SQLite compatibility was decided in the first place

ADR 0003 established two deployment tiers (A — shared hosting with MySQL; B — Docker / VPS).
SQLite was written into the consequences as the lightweight path for **Tier B development and
tests**: no database container to start, fast and hermetic unit tests, and a second engine
acting as a guard against accidentally depending on MySQL-only SQL. ADR 0004 then recorded that
the row-level tenant isolation design was compatible with both engines. Both were reasonable
expectations at the time — they were written before the schema existed.

### What is actually true (measured 2026-08-04, issue #217)

**SQLite cannot build the schema.** Phinx's SQLite adapter rejects the `enum` column type, so
migrations stop at the fifth file:

```
== 20260527000005 CreateScenariosTable: migrating
InvalidArgumentException: An invalid column type "enum" was specified for column "status".
```

**Nothing ever exercised the SQLite path**, which is why this went unnoticed for over two months:

- `grep -rl 'PDO\|sqlite' tests/` → **0 hits**. The PHPUnit suite opens no database connection.
- The full suite is green **with MySQL stopped**: 518 tests / 1,144 assertions.

So the `DB_ADAPTER=sqlite` block in `.env.example` — labelled "host / PHPUnit default" — was
configuration that had **never been used**. Following it produced an immediate migration failure.

### What withdrawing costs, and what supporting it would cost

Supporting SQLite means rewriting every `enum` column into a portable form (`string` plus a CHECK
constraint or application-level validation) across `database/migrations/`. That **changes the
production MySQL schema** — the tier that actually ships — to serve a development convenience that
no one currently uses. The risk lands on Tier A installs; the benefit lands nowhere.

## Decision

**NeNe Concierge supports MySQL only.**

- Migrations and end-to-end runs require MySQL (the `mysql` service in `compose.yaml`).
- The test suite requires **no database at all** — use cases and domain logic are tested against
  in-memory fakes.
- `.env.example` ships MySQL values only. The SQLite block is removed rather than left as a
  commented-out option, because an option that cannot work is not an option.

## Consequences

**Benefits**

- The documented default works. Copying `.env.example` and running migrations succeeds.
- One schema dialect to reason about; `enum` and other MySQL types stay available.
- The failure mode this replaces — a config that looks supported and fails on the fifth
  migration — is gone.

**Costs**

- No second engine guarding against MySQL-only SQL. Portability regressions would not be caught
  by tests; they would surface only if a port were attempted.
- Contributors need Docker (or a reachable MySQL) for migration and E2E work. Unit tests remain
  runnable with nothing but PHP.

**Follow-up**

- If SQLite (or another engine) is ever needed — for example, for a genuinely
  single-file Tier A variant — the entry point is the `enum` columns in
  `database/migrations/`. Convert them to a portable representation **first**, then re-evaluate.
  That work should supersede this ADR rather than amend it.
- Tier A packaging (ADR 0003) is unaffected: Tier A was always MySQL.

## Related

- Supersedes (in part): [ADR 0003](0003-dual-deployment-and-embed-widget.md),
  [ADR 0004](0004-multi-tenancy.md)
- Issues: #217 (documentation corrected to match reality), #221 (this ADR)
