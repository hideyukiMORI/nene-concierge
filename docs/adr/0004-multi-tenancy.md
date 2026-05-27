# ADR 0004: Multi-Tenancy Strategy

## Status

accepted

## Context

NeNe Concierge targets multiple operators (organizations) who may share a single deployed instance — for example, an agency managing chat scenarios for several clients, or a SaaS-style hosting service. At the same time, self-hosted single-operator installs must remain simple.

The sibling project NeNe Records has already implemented and validated a multi-tenancy pattern. Diverging from it would create inconsistency across the NeNe ecosystem and increase maintenance burden.

Alternatives considered:

1. **Install-per-tenant** — each tenant deploys a separate instance. Simple schemas, no isolation risk. Rejected as the sole model: impractical for an agency or hosted service managing many tenants.
2. **Shared instance, schema-per-tenant** — separate DB schemas per tenant. Rejected: incompatible with MySQL shared hosting (Tier A).
3. **Shared instance, row-level isolation with `organization_id`** (chosen): same tables, every row carries `organization_id`; middleware resolves the org on each request. Inherits the NeNe Records pattern.

## Decision

NeNe Concierge adopts the **same multi-tenancy implementation as NeNe Records**:

### 1. `organizations` table

```sql
CREATE TABLE organizations (
    id            INT UNSIGNED   NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(255)   NOT NULL,
    slug          VARCHAR(100)   NOT NULL,
    custom_domain VARCHAR(255)   NULL DEFAULT NULL,
    plan          VARCHAR(32)    NOT NULL DEFAULT 'free',
    is_active     BOOLEAN        NOT NULL DEFAULT 1,
    created_at    DATETIME       NOT NULL,
    updated_at    DATETIME       NOT NULL,
    UNIQUE INDEX organizations_slug (slug),
    UNIQUE INDEX organizations_custom_domain (custom_domain)
);
```

### 2. `organization_id` on every tenant-scoped table

All data tables (`scenarios`, `nodes`, `edges`, `sessions`, `messages`, `action_logs`, `appearances`, …) carry:

```sql
organization_id INT UNSIGNED NOT NULL DEFAULT 0
```

- `DEFAULT 0` is the **single-tenant sentinel**: a self-hosted install with one operator uses `organization_id = 0` without needing an `organizations` row.
- No DB-level foreign key on `organization_id` (idempotent migrations, Tier A compatibility).
- Every query in every `PdoRepository` appends `AND organization_id = ?`.

### 3. `OrgResolverMiddleware`

A PSR-15 middleware resolves the current organization from the request before any handler runs, and stores the org ID in a `RequestScopedHolder<int> $orgId`. Repositories receive `$orgId` via constructor injection.

**Bypass paths** (skip resolution, use `organization_id = 0` or no org context):

- `/health`
- `/api/v1/organizations` (superadmin)
- `/api/v1/superadmin/`
- `/api/v1/auth/`
- `/api/v1/public/` (visitor-facing embed widget endpoints use session token, not org slug)

### 4. Pluggable resolution strategies

| Strategy | Resolution method | Typical use |
| --- | --- | --- |
| `SubdomainResolutionStrategy` | `org1.nene-concierge.example.com` → `"org1"` | Tier B SaaS hosting |
| `CustomDomainResolutionStrategy` | `org1.com` → lookup by `custom_domain` | White-label Tier B |
| `PathPrefixResolutionStrategy` | `/org1/api/v1/…` → `"org1"` | Shared-path Tier B |
| `EnvResolutionStrategy` | `ORG_SLUG` env var → slug | Tier A / single-org Tier B |

Active strategy is configured via `TENANT_RESOLUTION` env var. Default: `env` (single-tenant behavior).

### 5. `organization_users` table

```sql
CREATE TABLE organization_users (
    organization_id INT UNSIGNED NOT NULL,
    user_id         INT UNSIGNED NOT NULL,
    role            VARCHAR(32)  NOT NULL DEFAULT 'admin',
    created_at      DATETIME     NOT NULL,
    PRIMARY KEY (organization_id, user_id),
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)         REFERENCES users          (id) ON DELETE CASCADE
);
```

### 6. Superadmin routes

`/api/v1/organizations` and `/api/v1/superadmin/` are accessible only with a superadmin JWT claim. They bypass org resolution and operate across all organizations.

## Consequences

**Benefits**

- Consistent pattern with NeNe Records; AI agents and contributors transfer knowledge.
- `DEFAULT 0` sentinel means Tier A single-org installs require zero tenant configuration.
- Pluggable resolution strategy covers subdomain, custom-domain, and env-based hosting.
- Row-level isolation is MySQL / SQLite compatible (Tier A + Tier B dev).

**Costs**

- Every repository query must include `AND organization_id = ?`.
- Migrations must add `organization_id` idempotently (check column existence before ALTER).
- Multi-org data export / import tooling is needed (see `OrgExport` in NeNe Records for reference).

**Follow-up**

- Implement `Organization` module in `src/Organization/` in Phase 0 scaffold (#2).
- Add `organization_id` to all Phase 1 schema migrations.
- Document Tier A single-org setup in `docs/deployment/shared-hosting.md`.

## Related

- ADR 0001 (governance inheritance from NENE2)
- ADR 0003 (dual deployment Tier A / Tier B)
- `docs/inheritance-from-nene2.md`
- Reference implementation: [`../nene-records/src/Organization/`](https://github.com/hideyukiMORI/nene-records/tree/main/src/Organization)
