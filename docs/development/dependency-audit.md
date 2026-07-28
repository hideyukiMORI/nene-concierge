# Dependency vulnerability gate (frontend)

Every PR runs a dependency audit as a **merge gate**. This document says what the gate is, how
an exception is granted, and what is currently excepted.

- Config: [`frontend/audit-ci.jsonc`](../../frontend/audit-ci.jsonc) — the file itself carries
  the reasoning for each entry. Keep the two in sync.
- Command: `npm run audit --prefix frontend`
- CI: part of `npm run check`, which `Frontend CI` runs.

## The gate

`audit-ci` fails the build on any **high** or **critical** advisory that is not explicitly
allowlisted. Moderate and below do not fail (they are still reported).

We use `audit-ci` rather than a bare `npm audit --audit-level=high` for one reason: **`npm audit`
has no way to record a reasoned exception.** Without one, the only ways past a not-yet-fixable
advisory are to lower the severity threshold or drop the step — both of which blind the gate to
*everything*, not just the advisory in question.

## Rules for an exception

1. **Per advisory id, never per severity.** Allowlist `GHSA-…`; do not raise the level and do
   not set `high: false`. A new advisory must still fail the build the day it lands.
2. **Bump first.** An exception is only for "no fix exists that we can adopt". Everything a
   bump could fix must be bumped before anything is listed. (#208 went from 9 findings to 2
   this way; listing all 9 would have hidden five fixable ones.)
3. **The reason must be measured, not assumed.** State why the vulnerable code path does not
   exist *in this codebase*, and how that was checked. "We probably don't use that" is not a
   reason.
4. **Every entry has an expiry and a named condition that removes it.** Write the condition as
   the **broken real path** ("eslint-plugin-jsx-a11y stops depending on minimatch@3"), not as a
   tool-generation name ("the eslint 10 wave"). Generation names drift; the path is checkable.
   An expired entry is a task — re-argue it in a PR; do not extend it by reflex.

## A green build is not evidence that an override is safe

Pinning a version to dodge an advisory silences the scanner; it does **not** promise the pinned
version still speaks the API its dependents expect.

The concrete case: `brace-expansion` changed its entry point shape between majors.

```
v1/v2   module.exports = expand           // callable
v5      module.exports = { expand, … }    // named exports only
```

`minimatch@3` does `const expand = require('brace-expansion')` and then calls it, so a flat
`"brace-expansion": "^5.0.8"` override makes it throw `TypeError: expand is not a function` —
but **only for patterns containing `{…}`**. Across the fleet this meant lint, tests, codegen and
builds all stayed **green** while the toolchain was broken (invoice #732, clear, serve: 4 paths,
3 broken, every gate `exit 0`).

Rules:

- **Scope an override per major** (`pkg@1` / `pkg@5`) unless every major is API-compatible and
  you have checked. Flat overrides cross major boundaries silently.
- **Add a probe** for any override that crosses a major.
  [`frontend/tests/toolchain/brace-expansion-override.test.ts`](../../frontend/tests/toolchain/brace-expansion-override.test.ts)
  walks `node_modules` on disk, resolves **every installed `minimatch`**, and pushes a brace
  pattern through it. It runs as part of `npm run test`, so the gate that hides the advisory
  also proves the fix did not break a dependent.
- **Verified both ways** (2026-07-29): with the scoped override the probe passes for
  `minimatch@3.1.5` and `minimatch@10.2.5`; with a flat `^5.0.8` it fails on `minimatch@3.1.5`
  with exactly `TypeError: expand is not a function`.

> Note for the fleet: in **this** repo `npm run lint` *did* also break under the flat override
> (concierge loads `eslint-plugin-jsx-a11y` directly), so concierge is not one of the
> silently-green ships. That is incidental, not a detector — the probe is the detector.

## Current exceptions

| Advisory | Package | Why it does not apply here | Expires |
| --- | --- | --- | --- |
| [GHSA-qwww-vcr4-c8h2](https://github.com/advisories/GHSA-qwww-vcr4-c8h2) | `react-router` (7.12.0–8.2.0) | The admin console is a **static SPA built by esbuild**, served from `public_html/admin/` by Apache — **there is no server runtime**. The router is `<BrowserRouter basename="/admin">` over `<Routes>/<Route element={…}>`, element-only. Measured 2026-07-29 in `frontend/src`: `react-server-dom` / `"react-server"` imports **0**; `createFromFetch` / `renderToPipeableStream` / `matchRSCServerRequest` / `StaticHandler` **0**; `createBrowserRouter` **0**; `@react-router/dev` **0**; route-level `action:` / `loader:` keys **0**. The advisory's attack path is a *server* executing a route action before returning 400; there is no server here to execute one. | **2026-08-31** |
| [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg) | `brace-expansion` (<=5.0.7) | The range covers the whole v1 line, which has **no fixed release** (v1 ends at 1.1.16). The v5 line is fixed and we take it (`brace-expansion@5: ^5.0.8`). The residue is **dev-only**: v1 arrives via `eslint-plugin-jsx-a11y` → `minimatch@3` → `brace-expansion@1.1.16`. Measured 2026-07-29: `npm ls --omit=dev` has **0** hits for those packages, and the shipped bundles `public_html/admin/app.js` and `public_html/widget.js` contain **0** occurrences of `brace-expansion` / `minimatch`. The DoS needs attacker-controlled glob patterns; ours are static repo config expanded on our own CI. | **2026-08-31** |

**Removal conditions**

- `GHSA-qwww-vcr4-c8h2` — there is **no fix in the 7.x line** (react-router 7 ends at 7.18.1;
  the fix is v8 ≥ 8.3.0, a breaking upgrade). Removed by the **react-router v8 migration wave**,
  bundled with the NENE2 RR8 re-evaluation.
- `GHSA-mh99-v99m-4gvg` — removed when **`eslint-plugin-jsx-a11y` stops depending on
  `minimatch@3`**, or the v1 line gets a patch release.

## Two grep traps in this repo

Recorded so the next person does not "correct" the react-router entry wrongly:

- `grep 'action:'` hits **6** times in `src/` — every one is this product's own **scenario
  action node** (`action_type`, `NODE_TOKENS.action`, …), not a router action.
- `grep -i 'rsc'` hits the German locale string `Erscheinungsbild`. Judge by real API names,
  never by the substring `rsc`.

## What was bumped instead of excepted (#208)

| Package | Before | After | How |
| --- | --- | --- | --- |
| `react-router` | 7.15.1 | **7.18.1** | direct — clears four RR advisories (all first-patched at 7.18.0) |
| `esbuild` | 0.28.0 | **0.28.1** | direct |
| `postcss` | 8.5.15 | **8.5.24** | override |
| `undici` | 7.26.0 | **7.29.0** | override (via `jsdom@29`, same major) |
| `vite` | 8.0.14 | **8.1.5** | override (via `vitest@4`) |
| `brace-expansion` | 5.0.7 | **5.0.8** | override, **scoped to `@5`** — v1.1.16 left untouched |

## Related

- [`coding-standards.md`](./coding-standards.md) — the wider merge-gate set
- Fleet reference implementation: contact (`audit-ci.jsonc` + this document, 施主 GO 2026-07-29).
  Sibling products may copy this — but each must **re-measure the RSC-unused and dev-only claims
  in its own tree** before copying an allowlist entry. Copying an exception without re-measuring
  is exactly the failure mode these rules exist to prevent.
