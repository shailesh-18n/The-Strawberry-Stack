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
- The fixed-answer assessments remain available. The Phase 6 coding assessment
  uses the configured managed execution provider after disclosure/consent;
  never execute learner source inside Express or claim this is a self-hosted
  runner.
- The previous in-memory store is a demo draft, not a replacement for configured MongoDB persistence.
- Hash/signature credentials remain a later-phase draft and are not a Phase 1
  requirement.
- The Phase 0 MVP and architecture description is documented in [ARCHITECTURE.md](ARCHITECTURE.md); user-facing product workflows remain deferred.

## Phase 2 student accounts

- Store student accounts and profiles in Mongoose rather than the legacy
  in-memory demo store.
- Use bcrypt password hashes, MongoDB-backed express sessions, session ID
  regeneration, HTTP-only/same-site cookies, and CSRF tokens for state-changing
  browser forms.
- Support Bengali and English as preferred languages, and restrict career
  aspirations to the configured choices until a later phase defines a career
  catalogue.
- Keep email immutable from the student profile form; account recovery and
  email verification are outside Phase 2.

## Phase 3 Career Navigator and assessment

- Store careers, skills, career mappings, prerequisites, and assessment
  attempts as Mongoose models/references; seed catalogue reference records
  idempotently.
- Rank career tracks deterministically from saved aspirations, structured
  interest tags, and listed/assessed skills. Build learning steps in
  prerequisite order.
- Render the graph as server-rendered SVG with a textual description and
  horizontal scrolling on narrow screens, using the existing EJS, Bootstrap,
  CSS, and vanilla JavaScript stack.
- Link passed guided assessments to their structured skill references and
  use them in recommendation matches.
- Keep progress, credential, and recruiter workflows outside this phase.

## Phase 4 Vernacular AI Assistant

- Keep assistant routes authenticated and CSRF-protected; respect the
  student's Bengali/English preference and limit user input.
- Call the configured OpenAI-compatible endpoint only when `AI_API_KEY`,
  `AI_API_URL`, and `AI_MODEL` are configured; derive Gemini's model from its
  model-specific URL. Require HTTPS except for localhost development, send
  only minimum career/skill context, and surface provider errors.
- Make offline profile guidance visibly distinct from provider-generated AI
  output; do not represent fallback text as an AI response.

## Phase 5 Offline-First Learning

- Cache only the public offline lesson shell, its local assets, and its
  public bilingual lesson pack. Never cache authenticated HTML or progress
  endpoints in the service worker.
- Include offline quizzes and store completed slugs, retry state, and the last
  server snapshot in IndexedDB. Require authentication and CSRF for sync,
  make server writes idempotent, and preserve concurrent completions with a
  completion-wins merge.
- Ship a small foundational HTML/CSS/JavaScript pack; AI generation,
  assessments, account features, and cloud synchronization remain online-only.
- Treat offline behavior and PWA installability as separate verification
  claims. Phase 5 verification included an actual native desktop install in
  Chrome and offline behavior testing.

## Phase 6 Practical Assessment Engine

- Use the user's configured OnlineCompiler.io API for the initial Python
  coding-assessment MVP. This is a managed third-party execution boundary, not
  a self-hosted gVisor claim. Require explicit student consent before
  transmitting source/test inputs and disclose provider retention.
- Never evaluate untrusted submissions in Express, `node:vm`, or an ordinary
  child process. Keep the provider API key server-only; validate and bound
  source, request attempts, results, and outputs. Persist only a source hash,
  not raw code, and make retries idempotent.
- Store code assessment results separately from legacy fixed-answer attempts
  using `StudentAssessment` fields and a minimal `SkillTrackProgress` record.
  A passing result alone adds the corresponding assessed-skill reference.
- The prior gVisor/OCI proposal and its adversarial test matrix remain a
  possible future self-hosted direction, not part of this provider MVP.
  Render/Oracle deployment and authenticated app-runner communication remain
  unprovisioned and unimplemented.

## Phase 7 SkillTrack (Git-inspired Learning History)

- Implemented the Git-inspired learning history model: Repository = Student learning
  profile; Commit = Completed assessment or milestone; Commit message = Achievement title;
  Branch = Learning/career path; Diff = Progress comparison between attempts; Tag =
  Verified milestone; Git log = Append-only chronological history.
- Historical achievements are append-only and never silently overwritten. Skill regressions
  are explicitly recorded as new commits with diff notes while preserving past milestones.
- Assessment completions automatically integrate into the commit history with tags and
  verification badges.

## Phase 8 Cryptographic Skill Passport

- Used asymmetric Ed25519 digital signatures to sign credentials. The private key remains
  server-side in `.keys` (ignored by Git) while the public key `.keys.pub` verifies signatures.
- Implemented deterministic SHA-256 evidence hashing over student ID, student name, skill,
  assessment, result, previous hash, and timestamp.
- Established an append-only cryptographic hash chain linking each credential to the previous
  credential's `evidenceHash` (`genesis` for the first).
- Stored credentials in a dedicated MongoDB `Credential` collection with unique idempotency
  indexes on `{ student, assessment }`.
- Provided a student-authenticated passport interface (`/credentials` and `/passport`) with
  scannable QR verification codes.
- Provided public verification routes (`/verify/:id` and `/verify/preview`) for independent
  cryptographic validation of signature and hash chain integrity without requiring authentication.

## Phase 9 Opportunity Matching & Recruiter Dashboard

- **Deterministic Skill Matching:** Employed weighted matching with 75% allocated to required
  skills and 25% to preferred skills. Assessed/verified skills receive full 1.0 weight while
  self-reported skills receive 0.8 weight.
- **Skill Gap Bridging:** The matching service highlights specific missing skills and references
  recommended learning activities and roadmaps directly from the catalog.
- **Recruiter Dashboard:** Built `/recruiter` with active opportunity listings, candidate discovery,
  and skill-based talent filtering.
- **Student Privacy Controls:** Added student portfolio privacy settings (`public` / `private`)
  toggled via CSRF-protected endpoint `POST /portfolio/privacy`.
- **Realistic Sample Data:** Pre-seeded 4 diverse internship opportunities (`Junior Python Developer Intern`,
  `Frontend Web Developer Intern`, `Junior Data Analyst Intern`, `Full Stack JavaScript Intern`) on startup.

## Phase 10 Integration and Quality Assurance

- Verified the complete unified student journey from initial registration, career ranking,
  vernacular assistant, coding assessment, Git-log commit generation, cryptographic passport issuance,
  QR code scanning, offline lesson sync, opportunity matching, and recruiter candidate discovery.
- Ensured strict MongoDB persistence, append-only immutability of historical records,
  idempotent re-runs, and full error recovery across all mounted routes.

## Phase 11 Deployment and Hackathon Readiness

- Prepared Render Blueprint `render.yaml` with explicit environment variable specifications
  (`MONGODB_URI`, `ONLINECOMPILER_API_KEY`, `AI_API_KEY`, `AI_API_URL`, `DNS_SERVERS`).
- Configured production proxy trust (`TRUST_PROXY=true`) to honor Render's single ingress hop.
- Prepared comprehensive hackathon demonstration script, architecture defense talking points,
  and responses to likely judge questions regarding cryptography, sandboxing, and offline-first sync.

## Free deployment target — requested, not provisioned

- The requested application target is a Render Free Node web service with
  MongoDB Atlas. `render.yaml` holds non-secret service configuration and
  requires the Atlas URI to be entered in Render's dashboard.
- The requested runner target is an Oracle Always Free Ampere A1 ARM64 Linux
  VM with gVisor, if the user's tenancy has capacity. gVisor supports ARM64
  and Linux 5.6+, but no Oracle account, region quota, or VM was verified here.
- Render Free cannot receive private network traffic. To avoid a public runner
  listener, the future Oracle agent must initiate authenticated outbound HTTPS
  polling to an application broker. That protocol/service is not implemented;
  do not claim secure app-to-runner communication yet.
- Free tiers have sleep, quota, availability, reclamation, and possible
  overage constraints. See `DEPLOYMENT.md`; do not describe the hosting as
  guaranteed always-on or unconditionally free.

## DNS resolution

- Use the operating system's DNS resolver by default. Allow an optional
  validated `DNS_SERVERS` list for networks where MongoDB Atlas SRV records
  cannot resolve through system DNS; do not hard-code a public resolver in
  application source.
- The current local `.env` uses Google Public DNS after the system resolver
  timed out resolving the configured Atlas SRV record. That setting is
  local-only and ignored by Git.
