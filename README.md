# notip-frontend

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=NoTIPswe_notip-frontend&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=NoTIPswe_notip-frontend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=NoTIPswe_notip-frontend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=NoTIPswe_notip-frontend)

Angular web client for the NoTIP platform. Provides authenticated users with dashboards for telemetry monitoring, gateway/sensor management, alert configuration, and administrative functions.

## Table of contents

- [notip-frontend](#notip-frontend)
  - [Table of contents](#table-of-contents)
  - [Architecture overview](#architecture-overview)
  - [Features](#features)
  - [Authentication](#authentication)
  - [Environment variables](#environment-variables)
  - [Development environment](#development-environment)
    - [Pre-commit hooks](#pre-commit-hooks)
    - [Conventional commits \& releases](#conventional-commits--releases)
    - [Code quality](#code-quality)
  - [Running locally](#running-locally)
    - [Docker](#docker)
  - [Scripts](#scripts)
  - [Testing](#testing)

---

## Architecture overview

```
┌─────────────────────────────────────────────────────┐
│                  notip-frontend                     │
│                   (Angular SPA)                     │
│                                                     │
│  ┌─────────────┐   ┌──────────────┐  ┌────────────┐ │
│  │  Dashboard  │   │  Management  │  │   Admin    │ │
│  │  & Charts   │   │  Panels      │  │  Functions │ │
│  └──────┬──────┘   └──────┬───────┘  └─────┬──────┘ │
│         │                 │                │        │
│         └─────────────────┼────────────────┘        │
│                           │                         │
│              ┌────────────▼────────────┐            │
│              │   Keycloak Auth Guard   │            │
│              │   + HTTP Interceptor    │            │
│              └────────────┬────────────┘            │
└───────────────────────────┼─────────────────────────┘
                            │ Bearer token
                            ▼
              ┌─────────────────────────┐
              │   notip-data-api        │
              │   (encrypted measures)  │
              └─────────────────────────┘
                            │
              ┌─────────────────────────┐
              │   @notip/crypto-sdk     │
              │   (client-side decrypt) │
              └─────────────────────────┘
```

The frontend communicates with backend services via REST APIs, using Keycloak for authentication. All measure data remains encrypted end-to-end — decryption happens client-side via `@notip/crypto-sdk`.

---

## Features

The application provides interfaces for:

- **Dashboard & telemetry monitoring** — real-time charts and historical data visualization
- **Gateway & sensor management** — view, configure, and monitor IoT gateways and connected sensors
- **Alert management** — configure offline alerts and timeout thresholds per gateway
- **Administrative functions** — manage tenants, users, API clients, thresholds, costs, and audit logs

---

## Authentication

Authentication and session management are handled by **Keycloak**. The Angular app uses `keycloak-angular` and `keycloak-js` to integrate with the Keycloak OIDC flow.

All HTTP requests to backend services are intercepted by an Angular `HttpInterceptor` that attaches the Keycloak Bearer token to the `Authorization` header. Routes are guarded by an `AuthGuard` that redirects unauthenticated users to the Keycloak login page.

> **Prerequisite:** a reachable and configured Keycloak instance must be available. Without Keycloak, the application cannot be accessed.

---

## Environment variables

The Angular app reads its configuration at build/run time through Angular environment files (`environment.ts`). When deployed, these are typically injected or overridden.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `KEYCLOAK_URL` | Yes | — | Keycloak server URL |
| `KEYCLOAK_REALM` | Yes | — | Keycloak realm name |
| `KEYCLOAK_CLIENT_ID` | Yes | — | OIDC client ID |
| `DATA_API_URL` | Yes | — | Base URL of notip-data-api |
| `MGMT_API_URL` | Yes | — | Base URL of notip-management-api |

Configuration is typically managed via Angular `environment.ts` / `environment.prod.ts` files or injected at runtime.

---

## Development environment

A Dev Container is provided (`.devcontainer/devcontainer.json`) based on the shared `ghcr.io/notipswe/notip-angular-dev` image. Opening the repo in VS Code or GitHub Codespaces will automatically install dependencies and register pre-commit hooks.

Recommended VS Code extensions are declared in the devcontainer: ESLint, Prettier, Jest Runner, SonarLint, the Docker extension, and the Angular Language Service.

### Pre-commit hooks

[pre-commit](https://pre-commit.com) runs the following checks on every commit:

| Hook | Command |
|------|---------|
| ESLint | `npm run lint:check` |
| Prettier | `npm run format:check` |
| TypeScript type check | `npm run typecheck` |
| Secret scanning | [gitleaks](https://github.com/gitleaks/gitleaks) v8 |

To install hooks manually: `pre-commit install --install-hooks`

### Conventional commits & releases

Commits must follow the [Angular commit convention](https://www.conventionalcommits.org). [semantic-release](https://semantic-release.gitbook.io) runs on `main` and automatically:

- bumps the version in `package.json`
- updates `CHANGELOG.md`
- creates a GitHub release

Release rules: `feat` → minor, `fix` / `docs` / `perf` → patch, breaking change → major.

### Code quality

SonarCloud analysis is configured in `sonar-project.properties` (project key `NoTIPswe_notip-frontend`, organisation `notipswe`). It consumes the lcov coverage report and ESLint JSON report.

---

## Running locally

```bash
# Open in devcontainer (recommended)

# Install dependencies
npm install

# Development server (port 4200)
npm start

# Production build
npm run build
```

The application is served on `http://localhost:4200` by default.

### Docker

```bash
docker build -t notip-frontend .
docker run -p 4200:80 notip-frontend
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the Angular dev server (port 4200) |
| `npm run build` | Production build |
| `npm run watch` | Development build in watch mode |
| `npm run test` | Run unit tests with Vitest |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:cov` | Run tests with coverage (LCOV + Sonar report) |
| `npm run lint` | Lint and auto-fix |
| `npm run lint:check` | Lint without fixing (CI) |
| `npm run lint:report` | Generate ESLint JSON report |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting without applying |
| `npm run typecheck` | TypeScript type-check without emit |
| `npm run fetch:openapi` | Regenerate API clients from OpenAPI contracts |

---

## Testing

```bash
# Unit tests
npm test

# Unit tests in watch mode
npm run test:watch

# Unit tests with coverage
npm run test:cov
```

Unit tests use **Vitest** with `jsdom` for DOM simulation. Tests are colocated alongside source files (`*.spec.ts`).

Coverage reports are written to `coverage/` in LCOV format, with a SonarQube-compatible report for CI integration.
