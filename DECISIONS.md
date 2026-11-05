# Decisions

## Phase 1 foundation

| Decision | Rationale |
| --- | --- |
| Keep CommonJS modules | Matches the existing project files and installed Node stack. |
| Use Express 5 and EJS | Matches the existing package and requested server/rendering stack. |
| Use Bootstrap 5 from jsDelivr | Provides the requested UI foundation without a separate frontend build pipeline. Its origins are explicitly allowed by the Content Security Policy. |
| Keep database connection ownership in `server.js` via `config/db.js` | Allows app routes and tests to load without opening a network connection. |
| Fail visibly on configured MongoDB connection failures | Avoids reporting a successful database-backed startup when persistence is unavailable. |
| Separate liveness from readiness | Process health remains testable when MongoDB is unavailable; readiness explicitly reports that dependency. |
| Do not wire feature routes or define product schemas in Phase 1 | Existing feature drafts are unmounted; their behavior and persistence must be implemented only in their approved phases. |

## Retained project constraints

- Keep the documented Node.js, Express, EJS, Bootstrap 5, MongoDB, and Mongoose stack; do not substitute React or Next.js.
- Keep external AI integrations server-side and secure if added later.
- Never execute untrusted assessment code in the Express process; the existing draft runs it in a separate subprocess.
- The previous in-memory store is a demo draft, not a replacement for configured MongoDB persistence.
- Earlier workspace notes proposed a rule-based assistant and hash/signature credentials; they are drafts, not working integrations or Phase 1 requirements.
- The Phase 0 MVP and architecture description is documented in [ARCHITECTURE.md](ARCHITECTURE.md); user-facing product workflows remain deferred.
