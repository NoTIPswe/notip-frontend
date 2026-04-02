# MSW Mock Layer

This directory contains the [Mock Service Worker](https://mswjs.io/) setup that lets you run the full Angular application locally without needing Keycloak, the Management API, or the Data API running.

## Quickstart

```bash
npm run start:mock   # http://localhost:4200
```

The app starts as `system_admin`.

## How it works

### Service Worker interception

MSW registers a Service Worker (`public/mockServiceWorker.js`) that intercepts every outgoing `fetch` request at the network level — inside the browser, before any real HTTP call is made. Handlers return fake responses; everything the app does (routing, guards, components, RxJS streams) behaves as if real backends are responding.

### Separate entry point

`npm run start:mock` uses an Angular build configuration that swaps the entry point from `src/main.ts` to `src/main.mock.ts`. Production code is never touched:

```
src/main.ts              ← production (Keycloak + real config)
src/main.mock.ts         ← mock (starts MSW worker, then bootstraps)
src/app/app.config.ts    ← production providers
src/app/app.config.mock.ts ← mock providers (no Keycloak)
```

`main.mock.ts` starts the MSW worker before Angular bootstraps, so no request escapes unhandled during app startup.

### Keycloak bypass

Keycloak uses browser redirects for its PKCE flow, which a Service Worker cannot intercept. The mock config solves this by never initialising Keycloak at all:

- `app.config.mock.ts` replaces `provideKeycloak(...)` with `{ provide: AuthService, useClass: DevAuthService }`
- `DevAuthService` (`src/app/core/services/dev-auth.service.ts`) implements the same public interface as `AuthService` but returns hardcoded values — `system_admin` role, `tenant-alpha` tenant, a fake bearer token string
- Services that inject `AuthService` directly (e.g. `ObfuscatedStreamManagerService`) transparently receive `DevAuthService` with no code changes

### SSE stream

The live telemetry stream (`/api/data/measures/stream`) uses `@microsoft/fetch-event-source`, which is built on `fetch`. Because MSW intercepts `fetch`, the SSE endpoint is fully mockable. The handler (`handlers/data-api.ts`) returns a `ReadableStream` with `Content-Type: text/event-stream` and emits a new `TelemetryEnvelope` event every 2 seconds via `setInterval`.

> The native `EventSource` API cannot be intercepted by MSW. Using `fetch-event-source` is what makes this work.

### In-memory state

Mutation endpoints (create, update, delete) operate on module-level arrays cloned from `fixtures.ts` at startup. Changes persist within a browser session and reset on page reload. This means navigating away and back after a create/delete reflects the change correctly.

## File structure

```
src/mocks/
├── browser.ts               # setupWorker(...handlers) — imported by main.mock.ts
├── fixtures.ts              # Stable seed data: tenants, gateways, sensors, users, etc.
└── handlers/
    ├── index.ts             # Combines all handler arrays
    ├── management-api.ts    # All /api/mgmt/* routes
    └── data-api.ts          # All /api/data/* routes, including SSE stream
```

## Adding or updating handlers

When backend specs change (`npm run fetch:openapi` pulls a new version):

1. Open the relevant handler file (`management-api.ts` or `data-api.ts`)
2. Add a handler that mirrors the new route — use the DTO types from `src/app/generated/openapi/` for type safety
3. Add any needed fixture data to `fixtures.ts`

Handlers are matched in order. More specific paths (e.g. `/gateways/:id`) must be listed after broad ones if there is any ambiguity, but in practice the MSW router handles path params correctly regardless of order.

## Fixture identity

All fixture IDs are stable strings (e.g. `gw-001`, `tenant-alpha`). This means you can hard-code a URL like `/gateways/gw-001` in the browser and it will always resolve. Do not use `Math.random()` or `Date.now()` for the primary fixture IDs in `fixtures.ts` — only for newly created records within handler mutations.
