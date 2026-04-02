# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm start               # Dev server on port 4200
npm run build           # Production build
npm run watch           # Watch mode (dev config)

# Testing
npm test                # Run all tests (watch mode)
npm run test:cov        # Run tests with coverage report (80% threshold)
npm test -- <file>.spec.ts                      # Single test file
npm test -- <file>.spec.ts -t "test name"       # Single test by name

# Code quality
npm run lint            # ESLint with auto-fix
npm run lint:check      # ESLint check (no fix, strict, CI mode)
npm run format          # Prettier format
npm run format:check    # Prettier check (CI mode)
npm run typecheck       # TypeScript type check (no emit)

# Code generation
npm run fetch:openapi   # Regenerate TypeScript clients from OpenAPI specs
```

Pre-commit hooks automatically run `lint:check`, `format:check`, `typecheck`, and Gitleaks on every commit.

Commits must follow the **Angular convention** (`feat:`, `fix:`, `docs:`, `perf:`, etc.) — this drives semantic versioning and changelog generation.

## Architecture

**Angular 21 standalone application** (no NgModules). All components use the standalone pattern. State management uses Angular Signals (no NgRx).

### Directory structure

```
src/app/
├── core/           # Singleton services, guards, interceptors, shared models
├── features/       # Role-gated feature areas
│   ├── admin/      # system_admin only
│   ├── alerts/     # tenant_admin
│   ├── dashboard/  # tenant_user+
│   ├── gateways/   # tenant_user+
│   ├── sensors/    # tenant_user+
│   ├── mgmt/       # tenant_admin (users, clients, thresholds, audit, costs)
│   └── system/     # Error page
├── shared/         # Reusable UI components (sidebar, modals, badges)
└── generated/      # Auto-generated OpenAPI clients — never edit manually
```

### Key files

| File | Purpose |
|---|---|
| `src/app/app.routes.ts` | All route definitions with guards and role metadata |
| `src/app/app.config.ts` | Root DI setup: Keycloak, HTTP interceptors, providers |
| `src/app/core/services/auth.service.ts` | Keycloak wrapper + impersonation logic |
| `src/app/core/guards/auth.guard.ts` | Validates Keycloak session |
| `src/app/core/guards/role.guard.ts` | Role-based access (reads route `data.roles`) |
| `src/app/core/interceptors/auth.interceptor.ts` | Injects Bearer token for `/api/(mgmt\|data)/**` |

### Authentication & roles

Keycloak (PKCE flow, realm `notip`, client `web-app`). Auto token refresh at 30 min, inactivity logout at 30 min.

Roles: `system_admin` > `tenant_admin` > `tenant_user`. System admins can impersonate other users — an `ImpersonationBanner` is shown when active.

### API integration

Two API surfaces, both auto-generated from OpenAPI specs:
- `generated/openapi/notip-management-api-openapi/` → Management API (`/api/mgmt`)
- `generated/openapi/notip-data-api-openapi/` → Data API (`/api/data`)

Run `npm run fetch:openapi` after backend spec changes. The `generated/` directory is excluded from ESLint.

Sensitive operations use `@notip/crypto-sdk` for encryption/obfuscation (see `ObfuscatedStreamManagerService`).

### Feature module conventions

Each feature follows: `pages/` (route-level smart components) → `components/` (presentational) → `services/` (feature-scoped).

### Testing

Framework: **Vitest 4** with jsdom + Angular TestBed. Coverage uses a **whitelist approach** — only specific service/component files are included in coverage metrics (configured in `vitest.config.ts`). Pages, models, routes, and generated code are excluded. Coverage reports go to SonarCloud via LCOV and vitest-sonar-reporter XML.

### Development environment

The recommended setup is the **devcontainer** (`ghcr.io/notipswe/notip-angular-dev:v0.0.1`), which pre-configures Node.js, Angular CLI, and pre-commit hooks. Port 4200 is forwarded automatically.
