# Project Status

## Completed phases

- **Phase 0 — Research and System Architecture:** The MVP problem statement,
  planned user journey, stack-compatible architecture, database/security
  designs, feature breakdown, and supporting documentation are recorded in
  `ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, and `DECISIONS.md`.
- **Phase 1 — Project Foundation:** The Node.js/Express app runs with EJS,
  Bootstrap 5, MongoDB/Mongoose connection lifecycle, environment-based
  configuration, baseline security and error handling, shared EJS site
  partials, a working home page, and liveness/readiness endpoints.

## Verification

Verified 2026-11-05:

- `npm test` — 10 tests passed, 0 failed.
- `npm audit` — 0 vulnerabilities.
- `node server.js` development smoke test from a clean configuration without
  MongoDB — home page and static CSS return HTTP 200, liveness returns HTTP
  200, and readiness returns HTTP 503.
- Production startup without `MONGODB_URI` fails as required.
- A live successful MongoDB connection was not exercised.

## Current boundary

Phase 1 is complete. **Phase 2 — Student Interface and Onboarding has not
started.** Wait for the user's explicit approval before beginning it. Existing
feature-oriented routes and services remain drafts, are not mounted by the
foundation app, and are not represented as working product workflows.

## Database

MongoDB must be running and `MONGODB_URI` set for the app to report ready. In
development the HTTP server can start without the variable to allow UI and
liveness checks; when a URI is configured, connection failures are surfaced and
prevent startup. Production startup requires the URI. No product models or
collections have been added.

## Workspace status

This folder has no Git metadata, so repository status, tracked-file state, and
diff history cannot be inspected. `.env` is present locally and `.gitignore`
excludes it, but tracked status cannot be verified without a Git repository.
