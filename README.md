# VidyaChain

VidyaChain is an MVP web application for helping students connect career goals
to practical skills, track progress, and demonstrate achievements. The current
verified scope is its Phase 1 foundation; student onboarding is the next phase.
Feature-oriented routes and services already present in the workspace are not
mounted as live product workflows.

## Stack

- Node.js 20+
- Express 5
- EJS server-rendered views
- Bootstrap 5
- MongoDB with Mongoose
- Vanilla JavaScript; do not replace the approved stack with React or Next.js

## Getting started

1. Install Node.js 20 or newer and make MongoDB available locally.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and adjust `MONGODB_URI` if needed. Keep `.env`
   local; it is ignored by Git.
4. Run `npm run dev` or `npm start`.
5. Open `http://localhost:3000`.

The server can start in development without `MONGODB_URI`; it logs a warning and `/health/ready` reports the database as unavailable. If a URI is configured, MongoDB connection failure stops startup. Production startup requires `MONGODB_URI`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the server with Node watch mode |
| `npm start` | Start the server |
| `npm test` | Run the built-in Node.js test suite |

## Phase 1 endpoints

- `GET /` renders the foundation page.
- `GET /health/live` reports that the process is serving requests.
- `GET /health/ready` reports whether MongoDB is connected.

The landing page and error pages share EJS site partials. Product onboarding
and other student workflows are not part of this phase.

## Security and project constraints

- Do not replace Express/EJS/Bootstrap with React or Next.js.
- Keep any future external AI integration server-side and secure.
- Never execute untrusted assessment code inside the Express process; the existing challenge runner uses a separate subprocess and must remain isolated.
- Follow the supplied phase requirements and implement only one approved phase
  at a time.

## Project documentation

- [PROJECT_STATUS.md](PROJECT_STATUS.md) — current phase and verification state
- [ARCHITECTURE.md](ARCHITECTURE.md) — runtime architecture and boundaries
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) — currently mounted HTTP endpoints
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) — persistence status and planned conceptual entities
- [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md) — implementation history
- [NEXT_AGENT.md](NEXT_AGENT.md) — next implementation boundary
- [DECISIONS.md](DECISIONS.md) — technical decisions and retained constraints
