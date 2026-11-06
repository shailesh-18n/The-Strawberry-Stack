# VidyaChain

VidyaChain is an end-to-end web platform connecting student learning
interests, skill verification, and career opportunities. It provides student
registration, persistent learning profiles, a Career Navigator with deterministic
skill-gap ranking and SVG dependency graphs, multilingual offline-first lessons with
IndexedDB sync, English/Bengali/Hindi/Kannada AI learning guidance, practical coding assessments,
a Git-inspired SkillTrack history, an Ed25519 Cryptographic Skill Passport with
QR verification, opportunity matching for internships, and a Recruiter Dashboard
with candidate talent discovery and privacy controls.

## Stack

- Node.js 20+
- Express 5
- EJS server-rendered views
- Bootstrap 5
- MongoDB with Mongoose
- Ed25519 asymmetric cryptography and SHA-256 evidence hashing
- Vanilla JavaScript; no heavy client framework dependencies

## Getting started

1. Install Node.js 20 or newer and make MongoDB available (local MongoDB or
   MongoDB Atlas).
2. Run `npm install`.
3. Copy `.env.example` to `.env`, set `MONGODB_URI`, and replace
   `SESSION_SECRET` with a randomly generated value of at least 32 characters
   (for example, generate one with
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
   Keep `.env` local; it is ignored by Git.
4. Run `npm run dev` or `npm start`.
5. Open `http://localhost:3000`.

MongoDB is required for registration, login, profile storage, and session
storage. The development server can still start without `MONGODB_URI` for
foundation/health checks, but readiness reports the database as unavailable
and data-backed student routes cannot work. If a URI is configured, connection
failure stops startup. Production startup requires `MONGODB_URI`.

The Phase 6 Python coding assessment requires `ONLINECOMPILER_API_KEY` in the
server environment. Obtain/configure the key separately; never place it in
browser code or commit it. Use an active REST API key, not a WebSocket/widget
key. The assessment form discloses that code and test
input are sent to OnlineCompiler.io and requires student consent. Tests mock
the provider by default. To run the live end-to-end test against the configured
provider and MongoDB, set `ONLINECOMPILER_LIVE_TEST=true` for `npm test`; this
submits a harmless Python program and creates then cleans up temporary records.

The app uses the operating system's configured DNS resolver by default. If
your network cannot resolve MongoDB Atlas SRV records, set the optional
`DNS_SERVERS` in `.env` to a comma-separated list of resolver IP addresses;
for example, `8.8.8.8,8.8.4.4`. Leave it blank to keep system DNS.

The vernacular assistant works in offline profile-guidance mode when no
provider is configured. For OpenRouter, set `AI_API_KEY`, `AI_API_URL` to
`https://openrouter.ai/api/v1/chat/completions`, and `AI_MODEL` to the exact
OpenRouter model slug. Gemini model-specific `:generateContent` endpoints are
also supported and derive the model from the URL without `AI_MODEL`. Provider
URLs must use HTTPS except for a local development endpoint. Keep provider
credentials in ignored `.env`; provider calls include the learner's preferred
language, career focus, listed skills, skill gaps, and next learning steps,
but not name or email. If a provider is configured but fails, the request
reports an error instead of silently substituting offline guidance. Live
OpenRouter requests using `openai/gpt-4o` were verified in Bengali and English.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the server with Node watch mode |
| `npm start` | Start the server |
| `npm test` | Run the built-in Node.js test suite |

## Student endpoints

- `GET /` renders the student onboarding landing page.
- `GET /auth/register` and `POST /auth/register` create an account and initial
  learning profile.
- `GET /auth/login` and `POST /auth/login` authenticate a student.
- `POST /auth/logout` ends the student session.
- `GET /dashboard` shows the signed-in student's profile summary.
- `GET /profile` and `POST /profile` view and update the student's profile.
- `GET /career` shows a deterministic profile-driven recommendation and skill
  graph; `GET /career?career=<slug>` focuses a known career path.
- `GET /assessment` lists skill-linked challenges; `POST
  /assessment/:challengeId/submit` records fixed-answer quiz results, commits to
  SkillTrack, and issues a cryptographic credential on pass.
- `POST /assessment/:challengeId/submit-code` sends the fixed Python coding
  challenge to OnlineCompiler.io, then persists bounded results,
  `SkillTrackProgress`, Git-inspired commits, and cryptographic credentials in MongoDB.
  Source is not stored; only its hash is.
- `GET /skilltrack` shows the Git-inspired learning history commit log,
  career-path branches, milestone tags, verification badges, and score diffs.
- `POST /skilltrack` records an immutable learner milestone commit in MongoDB.
- `GET /credentials` (and `/passport`) displays the student's Cryptographic Skill
  Passport with Ed25519 digital signatures, evidence hashes, and QR codes.
- `GET /verify/:id` and `GET /verify/preview` provide public independent cryptographic
  credential and hash chain verification.
- `GET /opportunities` matches student skills deterministically against active
  internship opportunities, displaying match percentages and missing skill gap suggestions.
- `GET /recruiter` provides the Recruiter Dashboard for discovering candidate talent
  pools, filtering by verified skills, and viewing candidate portfolios.
- `GET /portfolio/:id` renders a student's public/private skill portfolio.
- `POST /portfolio/privacy` toggles student portfolio privacy between public and private.
- `/public/offline-learning.html` provides cached multilingual English, Bengali, Hindi,
  and Kannada HTML, CSS, and JavaScript lessons with offline quizzes. Completions and queued sync
  state are stored in IndexedDB and can be synced to the signed-in student's
  MongoDB profile while online. Completion-wins merging preserves progress
  created concurrently on another device.
- `GET /assistant` and `POST /assistant` provide vernacular career/skill
  guidance with the configured provider or transparent offline mode.
- `GET /health/live` reports that the process is serving requests.
- `GET /health/ready` reports whether MongoDB is connected.

Registration collects name, email, password, preferred language, learning and
career interests, and optional education/learning/access details. Login
passwords of at least 10 characters and no more than 72 UTF-8 bytes are hashed
before persistence. User documents and Express sessions are stored in MongoDB.
State-changing form submissions require a session CSRF token. Email is
immutable through the student profile form. The Career Navigator uses
MongoDB-backed structured career/skill records and saved profile information;
its recommendation ranking is deterministic.

## Security and project constraints

- Do not replace Express/EJS/Bootstrap with React or Next.js.
- Keep AI provider access server-side; never expose keys in EJS, browser
  JavaScript, or client requests.
- The coding assessment uses a third-party managed execution provider; the
  Express process never evaluates student code. This is not a self-hosted
  gVisor runner, and provider sandbox/data-retention claims are not independently
  audited by VidyaChain. Keep the provider key server-side and never send source
  without consent.
- Keep the `.env` file and generated `.keys` files out of Git.
- Phases 0–11 are fully implemented and verified.
  - Phase 7 implements the Git-inspired learning history with chronological commit
    logging, career branches, milestone tagging, and score diffs.
  - Phase 8 implements the Cryptographic Skill Passport with Ed25519 asymmetric
    signatures, deterministic SHA-256 evidence hashing, cryptographic hash chaining,
    and QR verification.
  - Phase 9 implements Opportunity Matching with realistic internship listings,
    deterministic skill matching (verified vs reported), gap-bridging recommendations,
    a Recruiter Dashboard, student skill portfolios, and privacy controls.
  - Phase 10 verifies the end-to-end student journey across all services with full
    MongoDB persistence and live API testing.
  - Phase 11 prepares production deployment with Render Blueprint configuration (`render.yaml`),
    MongoDB Atlas setup, environment security guidelines, demo accounts, and hackathon presentation resources.
- The coding assessment uses a third-party managed execution provider; the
  Express process never evaluates student code. Deployment status and constraints are in
  [DEPLOYMENT.md](DEPLOYMENT.md) and the security architecture is in
  [PHASE6_EXECUTION_ARCHITECTURE.md](PHASE6_EXECUTION_ARCHITECTURE.md).
- Offline mode includes the three packaged foundational lessons and
  quizzes. AI generation, guided assessments, account features, and cloud
  progress synchronization require a network connection.

## Project documentation

- [PROJECT_STATUS.md](PROJECT_STATUS.md) — current phase and verification state
- [ARCHITECTURE.md](ARCHITECTURE.md) — runtime architecture and boundaries
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) — currently mounted HTTP endpoints
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) — persistence status and planned conceptual entities
- [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md) — implementation history
- [NEXT_AGENT.md](NEXT_AGENT.md) — next implementation boundary
- [DECISIONS.md](DECISIONS.md) — technical decisions and retained constraints
- [DEPLOYMENT.md](DEPLOYMENT.md) — free-tier deployment configuration, status,
  limits, and required verification
