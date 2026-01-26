# Airtable TS Library — Repo Structure & Development Plan

This repository contains a **single TypeScript package** that exposes **two entrypoints**:

- `@scope/airtable/core` → **runtime-safe**, shareable code (types, schemas, mappers, pure utilities)
- `@scope/airtable/server` → **server-only** Airtable HTTP client (requires token/baseId)

The library is designed around a **configured client** created once via a factory:
`createAirtableClient({ token, baseId, ... })`.

---

## Goals

1. **Reusable across projects**:
   - Node backends
   - Server-side code inside React repos (e.g., Next API routes, Server Actions, Remix loaders/actions, scripts)
2. **No secrets inside the library**:
   - Tokens/keys are always provided by the caller at runtime.
3. **Clear separation**:
   - `core` never performs HTTP requests
   - `server` performs Airtable API calls and depends on runtime secrets

---

## Public API (Entrypoints)

### `@scope/airtable/core`
Contains:
- Domain types
- Zod schemas (optional but recommended)
- Record mappers: `toFields()` / `fromRecord()`
- Shared helpers (pure functions)

✅ Safe to import from anywhere (including frontend bundles), because it does not call Airtable.

### `@scope/airtable/server`
Contains:
- `createAirtableClient(config)`
- HTTP request layer (fetch, retry/backoff, error parsing)
- CRUD operations: list/get/create/update/delete
- Optional “table repository” helpers for ergonomics

⚠️ Must only be imported in server environments (Node/runtime with secrets).

---

## Repository Layout (Single Package)

Recommended top-level structure:

```
.
├─ src/
│ ├─ core/
│ │ ├─ index.ts
│ │ ├─ types/
│ │ │ ├─ airtable.ts
│ │ │ └─ domain.ts
│ │ ├─ schemas/
│ │ │ └─ (optional zod schemas per table/domain)
│ │ ├─ mappers/
│ │ │ └─ (toFields/fromRecord per domain)
│ │ └─ utils/
│ │ └─ (pure utils: dates, strings, normalization)
│ │
│ ├─ server/
│ │ ├─ index.ts
│ │ ├─ client/
│ │ │ ├─ createClient.ts
│ │ │ ├─ request.ts
│ │ │ ├─ endpoints.ts
│ │ │ ├─ pagination.ts
│ │ │ ├─ errors.ts
│ │ │ └─ retry.ts
│ │ ├─ repos/
│ │ │ ├─ createTableRepo.ts
│ │ │ └─ (optional ready-made repos per domain)
│ │ └─ utils/
│ │ └─ (server-only helpers, if needed)
│ │
│ └─ index.ts
│
├─ tests/
│ ├─ unit/
│ │ ├─ core/
│ │ └─ server/
│ └─ integration/
│ └─ (optional; requires AIRTABLE_TOKEN in env)
│
├─ examples/
│ ├─ node-script/
│ └─ next-route-handler/
│
├─ .github/
│ └─ workflows/
│ └─ ci.yml
│
├─ package.json
├─ tsconfig.json
├─ tsup.config.ts
├─ README.md
├─ LICENSE
└─ CHANGELOG.md
```

---

## What Each Directory Contains

### `src/`
All TypeScript source code.

#### `src/index.ts`
- Optional convenience exports (usually minimal).
- **Do not** export server-only things from here unless you explicitly want it.
- Recommended: keep this empty or re-export only “neutral” symbols.

#### `src/core/`
Everything that is safe to import anywhere.

- `src/core/index.ts`
  - Exports the public core API (types, schemas, mappers, utils).
  - Treat this as the **only public surface** for `/core`.

- `src/core/types/`
  - `airtable.ts`: generic Airtable record shapes and helpers
    - `AirtableRecord<TFields>`
    - `AirtableListResponse<TRecord>`
    - common field types
  - `domain.ts`: domain-level types used across projects (e.g., `Lead`, `Partner`)

- `src/core/schemas/` (optional but recommended)
  - Zod schemas per domain/table to validate:
    - incoming objects from Airtable (`fromRecord`)
    - outgoing models before writing (`toFields`)
  - Keep these schemas **pure** and runtime-safe.

- `src/core/mappers/`
  - One mapper module per domain/table:
    - `toAirtableFields(model) -> Airtable fields object`
    - `fromAirtableRecord(record) -> validated domain model`
  - Mappers should not call network or read env vars.

- `src/core/utils/`
  - Pure utilities used by mappers/schemas.
  - Examples: normalize phone, parse dates, safe string trimming.

---

### `src/server/`
Server-only code that calls Airtable.

- `src/server/index.ts`
  - Exports the server API (client factory, repos).
  - Treat as the **only public surface** for `/server`.

#### `src/server/client/`
All Airtable HTTP mechanics.

- `createClient.ts`
  - Exports `createAirtableClient(config)`
  - Stores config (token, baseId, apiUrl, timeout, retry config)
  - Returns an object with methods (CRUD)

- `request.ts`
  - The only place that actually calls `fetch(...)`
  - Adds headers (`Authorization: Bearer ...`)
  - Handles JSON parse, non-2xx responses, timeouts (AbortController)
  - Converts Airtable errors into library errors

- `endpoints.ts`
  - Centralized URL builders:
    - base URL format
    - encode table names/ids
    - querystring builder for `view`, `filterByFormula`, `maxRecords`, `pageSize`, etc.

- `pagination.ts`
  - Utilities for offset-based pagination
  - Provides:
    - `listAll()` (auto paginates)
    - `listPage()` (single page)
  - Keeps pagination logic out of `createClient.ts`

- `errors.ts`
  - Defines error types/classes:
    - `AirtableHttpError` (status, body)
    - `AirtableAuthError`, `AirtableRateLimitError`, etc. (optional)
  - Contains a function like `parseAirtableError(payload)`

- `retry.ts`
  - Minimal retry/backoff policy (only for 429/5xx)
  - Configurable via client config (max retries, base delay, jitter)

#### `src/server/repos/`
Ergonomic repository layer on top of the raw client.

- `createTableRepo.ts`
  - `createTableRepo(client, { tableName, toFields, fromRecord })`
  - Returns:
    - `list()`, `get(id)`, `create(model)`, `update(id, patchOrModel)`, `delete(id)`
  - This is where you connect `core` mappers to the server client.

- Optional domain repos (later)
  - `leadsRepo.ts`, `partnersRepo.ts`, etc.
  - These simply call `createTableRepo(...)` with the appropriate mapper.

#### `src/server/utils/`
- Server-only helpers if needed (usually keep minimal).

---

### `tests/`
Test organization:

- `tests/unit/core/`
  - Pure unit tests: schemas, mappers, utils.
- `tests/unit/server/`
  - Unit tests for URL building, error parsing, retry logic.
  - Mock `fetch` for request layer tests.
- `tests/integration/` (optional)
  - Calls Airtable real API.
  - Requires env vars:
    - `AIRTABLE_TOKEN`
    - `AIRTABLE_BASE_ID`
    - `AIRTABLE_TABLE_NAME` (optional)

---

### `examples/`
Small usage examples (kept simple, not production apps):

- `examples/node-script/`
  - Shows Node usage with `createAirtableClient(...)`
- `examples/next-route-handler/`
  - Shows Next.js API route usage (server-only)
  - Explicitly demonstrates “never expose token to the browser”

---

## Required Root Files (What They Should Contain)

### `package.json`
Must include:
- `name`, `version`, `type` (usually `"module"` if ESM)
- `main/module/types` generated by build
- **Exports map** for two entrypoints:

Example concept (adapt to your build output):
- `exports["./core"]` → `dist/core/index.js` + types
- `exports["./server"]` → `dist/server/index.js` + types

Also include scripts:
- `build`, `test`, `lint`, `typecheck`, `release` (optional)

### `tsup.config.ts`
- Builds `src/core/index.ts` and `src/server/index.ts` to `dist/`
- Emits `.d.ts`
- Targets modern Node runtime (and server runtimes)

### `tsconfig.json`
- Strict mode on
- Path aliases optional (keep simple if you plan to publish)

### `README.md`
Must document:
- Installation
- Entrypoints (`/core` and `/server`)
- Security note: server-only usage
- Examples: Node + Next route handler

### `.github/workflows/ci.yml`
- Install deps
- Typecheck + test + build

### `CHANGELOG.md`
- Human-readable release notes (semver)

---

## Expected Flows

### Flow 1 — Node Backend Usage
1. Project reads secrets from env/secret manager
2. Project creates a configured client once:
   - `const client = createAirtableClient({ token, baseId })`
3. Project calls CRUD methods or repos.
4. Core mappers validate/convert data.

**Key point:** the token never lives in the library; it’s passed by the caller.

---

### Flow 2 — React Repo (Server-only Code)
1. In a server file (API route, server action, loader):
   - read secrets from server env
2. Create client once per request or reuse via module singleton (depending on runtime)
3. Call Airtable methods
4. Return sanitized result to the client UI

**Never** call Airtable directly in browser components.

---

### Flow 3 — Domain Repositories (Optional DX Layer)
1. Define domain model + schema in `core`
2. Define mapper in `core/mappers`
3. Create repo in `server/repos` that binds:
   - tableName
   - `toFields` / `fromRecord`
4. Consumers use:
   - `const leads = createLeadsRepo(client)`
   - `await leads.create({...})`

---

## Development Conventions

- **Only export public API from**:
  - `src/core/index.ts`
  - `src/server/index.ts`
- Internal modules should not be imported by consumers directly.
- Keep the request layer **single-source-of-truth** (`request.ts`).
- Prefer small functions with clear responsibilities:
  - build URL
  - perform request
  - parse response
  - map/validate domain model

---

## Ordered TODO List (Phase 0 → MVP)

1. **Scaffold**
   - Create repo + folder structure
   - Add TypeScript config
   - Add tsup build config
   - Add package exports for `./core` and `./server`

2. **Core foundation**
   - Add `core/types/airtable.ts` generic types
   - Add minimal `core/utils/` helpers (only if needed)

3. **Server client MVP**
   - Implement `createAirtableClient(config)` in `server/client/createClient.ts`
   - Implement `request.ts` with:
     - auth header
     - JSON handling
     - timeout (AbortController)
     - error normalization
   - Implement URL builders in `endpoints.ts`

4. **CRUD**
   - `getRecord`, `listRecords` (+ offset support), `createRecord`, `updateRecord`, `deleteRecord`

5. **Pagination helper**
   - `listPage()` + `listAll()` (auto-paginate)

6. **Errors**
   - Define `AirtableHttpError` (+ optional specific errors)
   - Make all methods throw normalized errors

7. **Repo layer (DX)**
   - Implement `createTableRepo(...)`
   - Add one example domain mapper + repo (e.g., `Lead`)

8. **Tests**
   - Unit tests for URL building and error parsing
   - Unit tests for core mappers (if using schemas)

9. **Docs + Examples**
   - README with 2 entrypoints + security note
   - Node example + Next route handler example

10. **Release**
   - Add changelog entries
   - Tag `v0.1.0` and publish (private/public)

---
