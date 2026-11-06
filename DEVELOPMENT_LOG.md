# Development Log

## 2026-11-05 — Phase 2 Student Interface and Onboarding

- Added a Mongoose `User` model with normalized unique email, hidden bcrypt
  password hash, language, career/learning interests, profile details, and
  timestamps.
- Replaced the unmounted in-memory auth draft with MongoDB-backed registration,
  login, logout, and authenticated profile routes.
- Added profile field validation, supported career/language choices, session
  ID regeneration, MongoDB-backed express sessions, and session-bound CSRF
  validation.
- Built onboarding, login, student dashboard, and editable profile EJS views;
  updated navigation to expose only implemented Phase 2 student actions.
- Removed the checked-in fixed demo bcrypt hash from the working tree. Legacy
  demo creation now uses a fresh random password hash.
- Updated project, architecture, schema, API, and next-agent documentation.
- Verified with `npm test` (12 passing, including live Atlas persistence and
  optional DNS resolver validation),
  `npm audit` (0 vulnerabilities), direct Mongoose Atlas connection, and a
  live Express/Atlas smoke test.
- Audited Git state: `.env` and signing keys are ignored/untracked. The old
  demo bcrypt hash remains in local commit history; history was not rewritten.
- Reviewed the fixed hash in commits `2e2037f` and `78d5825`: it belongs to
  the dormant `seedDemoUser` account for Vivek Das. No plaintext password was
  found; cracking was not attempted. Documented a pre-publication targeted
  history-cleanup recommendation without rewriting history.
- Replaced the unconditional Google DNS override with optional validated
  `DNS_SERVERS` IP configuration. Default remains operating-system DNS; the
  ignored local `.env` explicitly retains the working Atlas resolver because
  this environment's default resolver timed out on Atlas SRV lookup.

## 2026-11-05 — Phase 3 Audit and Structured Skill Graph

- Audited the completed Phase 2 source and expanded the Atlas-backed end-to-end
  test to cover invalid profile rejection, persisted skills, authentication
  gating, and career navigation based on saved profile data.
- The audit found the previous Phase 3 implementation did not include
  persistent Career/Skill models, prerequisite-aware roadmaps, or a link from
  passed assessments to saved student skills.
- Added Mongoose Career and Skill models, idempotent MongoDB catalogue seeding,
  structured interest tags, required-skill mappings, prerequisite references,
  and deterministic recommendations tested across distinct profile goals.
- Added dependency-ordered personal roadmaps, prerequisite edges in the graph,
  and MongoDB assessment attempt persistence; passed skills now count as
  assessed evidence in career matching.
- No dependencies were added. Atlas-backed integration tests exercise catalog
  references, varied profiles, assessment persistence, and authenticated
  career pages.

## 2026-11-05 — Phase 4 Vernacular AI Assistant

- Mounted an authenticated Bengali/English learning-assistant route using
  saved career and skill context, form CSRF protection, and question-length
  validation.
- Added an OpenAI-compatible provider adapter configurable with `AI_API_KEY`,
  `AI_API_URL`, and `AI_MODEL`. Provider configuration is HTTPS-only except
  local development endpoints; provider failures are reported.
- Added a clearly labeled local profile-guidance mode when no AI provider is
  configured. The external provider path was subsequently verified with the
  configured OpenRouter credentials in both Bengali and English.
- Added assistant/provider configuration tests and updated project docs and
  continuation boundaries. Phase 5 remains unstarted.
- Final validation: `npm test` (27 passed, including Atlas-backed data,
  recommendation, assessment and assistant flows), `npm audit` (0
  vulnerabilities), syntax/EJS checks, `git diff --check`, and a live server
  startup/health/registration smoke test using the configured Atlas resolver.

## Phase 4 live-provider verification follow-up

- Added support for deriving a Gemini model from a model-specific
  `:generateContent` URL and sending Gemini-native requests. This integration
  path remains available, but the currently configured provider is OpenRouter.
- Fixed the Atlas integration test to isolate its offline-assistant check from
  developer-local AI provider configuration and restore the environment after
  the request.
- Verification in this follow-up: `npm test` (30 passed, 0 failed),
  `npm audit` (0 vulnerabilities), `node --check services/aiService.js`,
  `node --check test/app.test.js`, and `git diff --check` all passed. The
  Atlas-backed integration flow passed.

## 2026-11-06 — OpenRouter live assistant verification

- Safely identified the configured provider endpoint as OpenRouter's standard
  chat-completions path; the model is not embedded in that endpoint.
- Set `AI_MODEL=openai/gpt-4o` in ignored local `.env` using the model slug
  supplied by the user. Did not modify or display the API key.
- Sent real profile-context prompts in Bengali and English. Both returned
  AI-mode responses; the Bengali response included Bengali script, and neither
  response contained the API key.
- Updated current status and setup/API documentation to distinguish
  OpenRouter's `AI_MODEL` requirement from URL-derived Gemini model selection.
  Phase 5 remains unstarted pending explicit approval.

## 2026-11-06 — Phase 4 Audit and Phase 5 Offline-First Learning

- Re-audited the live OpenRouter integration using the configured
  `openai/gpt-4o` model. Real Bengali and English requests returned AI-mode
  replies grounded in a generic Web Developer profile and roadmap; Bengali
  script was present, relevant roadmap skills were mentioned, and replies
  contained no API key. The assistant sends keys only in server-side request
  headers, limits questions to 1,000 characters, provider output to 450
  tokens, and provider calls to a 12-second timeout. The app-wide request
  limit is 100 requests per IP per 15 minutes.
- Added three bilingual offline lessons for HTML, CSS, and JavaScript with
  explanations, practice activities, self-check prompts, and quizzes. The service
  worker pre-caches only the static lesson shell/assets and public lesson
  pack, falls back to the lesson shell for offline navigation, and deletes
  the prior broad GET-response cache that could retain private pages.
- Added IndexedDB completion tracking and a retry queue, plus authenticated,
  CSRF-protected, idempotent MongoDB synchronization through
  `LearningProgress`. Completion-wins merging preserves and reports
  concurrently completed lessons. Progress state responses are private/no-store;
  offline lesson content is public and does not create a session cookie.
- Added unit and Atlas integration coverage for bilingual lesson contents,
  progress validation, worker cache behavior/cleanup, public pack caching,
  repeated sync, and conflict merging.
- Chromium network-offline browser verification demonstrated root-scoped
  worker control, offline page reload and quiz use with `navigator.onLine`
  false, IndexedDB queuing, reconnection/sync, and a concurrent completion
  merged during synchronization.

## 2026-11-06 — Phase 5 offline audit follow-up

- Corrected the service-worker cache version so the updated IndexedDB client
  is installed instead of served from a prior cache; added coverage for
  cleanup of the previous cache.
- Fixed the offline shell test to read its response body once and assert the
  active cache version. Removed a duplicate no-store header assignment.
- `npm test` — 35 passed, 0 failed, 0 skipped, including live Atlas student,
  progress persistence, idempotency, and concurrent-conflict checks.
- `npm audit` — 0 vulnerabilities. Changed server, worker, browser, and test
  files pass `node --check`.
- Phase 5 native PWA installation was verified in Chrome 156.0.8078.80 using
  a dedicated test profile: Chrome reported no manifest/installability errors,
  displayed the native install prompt, installed VidyaChain, and opened its
  lesson page in standalone display mode under a service-worker controller.
- The full Phase 5 verification checklist passed: installation, offline lesson
  and pack access, quizzes, IndexedDB storage, queued sync, duplicate
  idempotence, and completion-wins conflict merging. Atlas-backed integration
  and Chromium offline tests are recorded above.

## 2026-11-06 — Phase 6 practical assessment audit

- Confirmed the mounted assessment path is a fixed-answer quiz backed by
  `StudentAssessment`; there is no coding challenge model, source-submission
  UI, multi-case code evaluator, or isolated execution runner.
- The legacy `evaluatePythonChallenge` helper rejects code submissions. Added
  an Atlas-backed regression check that posts source text to the mounted quiz,
  verifies it is not evaluated inside Express, and confirms the failed attempt
  is persisted. Existing passed/failed quiz tests continue to cover scoring
  and skill-record updates.
- `npm test`: 35 passed, 0 failed; `npm audit`: 0 vulnerabilities.
- No source runner or new dependency was added: Docker/Podman and other
  container sandbox tools are unavailable in this environment. No learner
  code was executed. Phase 6 is not implemented and is blocked. Do not begin
  Phase 7 or Phase 8.
- Prepared `PHASE6_EXECUTION_ARCHITECTURE.md`, comparing native OS isolation,
  nsjail, gVisor with OCI, and managed execution. It proposes a dedicated
  Linux gVisor runner, bounded resource policy, result-persistence design, and
  adversarial security-test matrix. No Phase 6 implementation or infrastructure
  was added at that time.

## 2026-11-06 — Free deployment preparation

- Added `render.yaml` for the Express/EJS application: Render Node Free web
  service, Singapore region, `npm ci`, `npm start`, `/health/ready`, generated
  session secret, dashboard-provided Atlas URI, one-hop proxy-aware secure cookies,
  and automatic deployment disabled.
- Limited Express proxy trust to one hop when `TRUST_PROXY=true`, avoiding
  unconditional trust of client-supplied forwarding headers; added a
  subprocess regression test for the production setting.
- Reviewed current Render, Oracle Always Free, and gVisor documentation.
  Oracle A1 ARM64 is technically compatible with gVisor's ARM64/Linux 5.6+
  requirements, subject to tenancy quota, home-region capacity, and idle VM
  reclamation. Render Free cannot receive private-network traffic.
- Added `DEPLOYMENT.md` with the outbound-only Oracle-to-app broker design
  requirement, provider limits, setup steps, and live verification checklist.
- No live Render service, Oracle VM, runner, broker, or authenticated
  communication channel was created or tested. No student code was executed.
  This session had GitHub authentication but no Render deployment access or
  Oracle CLI/configuration/SSH access. Existing modified files were not
  pushed or committed. No Phase 7/8 work began.

## 2026-11-06 — Phase 6 managed execution MVP

- Added one fixed Python List Sum challenge using the configured OnlineCompiler.io
  run-tests API. The server validates source size, consent, a per-student rate
  limit, and a server-issued idempotency key before sending a request. No
  submitted code is evaluated by the Express process.
- Persisted bounded code-assessment results in `StudentAssessment` and
  retry-safe `SkillTrackProgress`; only a SHA-256 source hash is stored.
  Hidden-test output/error fields are removed. Passed submissions add the
  assessed Python skill. The form explains provider processing/retention and
  requires consent.
- Kept provider credentials server-side with `ONLINECOMPILER_API_KEY` and
  added the empty variable to `.env.example`. The opt-in
  `ONLINECOMPILER_LIVE_TEST=true` test exercises provider execution and Atlas
  persistence; default tests mock external requests.
- This is a managed third-party execution MVP, not a VidyaChain-operated
  gVisor runner. Provider security/retention claims are not independently
  verified. Render, Oracle, and runner deployment remain unprovisioned.
- Verification after implementation: `npm test` — 41 passed, 0 failed,
  0 skipped; production dependency audit found 0 vulnerabilities; syntax and
  `git diff --check` passed.
- The opt-in live provider/Atlas test was run twice. The first attempt exposed
  and fixed an error-path variable-scope bug. The subsequent attempt reached
  OnlineCompiler.io, which rejected the configured key as invalid or inactive
  (HTTP 404). After the user replaced the local ignored `.env` value with an
  active REST API key, `ONLINECOMPILER_LIVE_TEST=true node --test
  test/app.test.js` passed 14/14. The harmless Python sum program passed all
  four provider tests at 100%; `StudentAssessment`, `SkillTrackProgress`, and
  the assessed skill were verified in Atlas, and temporary records were
  removed. No key was printed or exposed to the browser.

## 2026-11-06 — Phase 9 Opportunity Matching & Recruiter Dashboard

- Built `models/Opportunity.js` schema and `services/opportunityService.js` matching engine.
- Implemented deterministic matching scoring (75% required / 25% preferred, verified skills = 1.0, self-reported = 0.8).
- Implemented skill gap extraction with actionable recommendation text and prerequisite references.
- Pre-seeded 4 diverse internship opportunities (`Junior Python Developer Intern`, `Frontend Web Developer Intern`, `Junior Data Analyst Intern`, `Full Stack JavaScript Intern`).
- Added `routes/opportunity.js` (`GET /opportunities`) and view `views/opportunities/index.ejs`.
- Added `routes/recruiter.js` (`GET /recruiter`, `GET /portfolio/:id`, `POST /portfolio/privacy`).
- Added student skill portfolio view `views/student/portfolio.ejs` and recruiter dashboard view `views/recruiter/dashboard.ejs`.
- Added unit tests in `test/opportunityService.test.js` verifying match calculations, skill categorization, and sample data.

## 2026-11-06 — Phase 10 End-to-End Integration & Quality Assurance

- Conducted exhaustive end-to-end integration test across all 11 phases in `test/app.test.js`.
- Verified student registration, login, career navigation, vernacular AI assistant, coding assessment, Git-log commit recording, Cryptographic Skill Passport issuance, QR verification, offline lesson sync, opportunity matching, and recruiter candidate discovery.
- Resolved evidence hash determinism and date serialization formatting in `credentialService.js`.
- Verified test suite: 58 passed, 0 failed, 0 skipped.
- Verified live opt-in coding assessment against OnlineCompiler.io and MongoDB Atlas: 58 passed, 0 failed, 100% score across all 4 test cases.
- Audited production dependencies: 0 vulnerabilities.

## 2026-11-06 — Phase 11 Deployment & Hackathon Readiness

- Updated Render Blueprint `render.yaml` with required environment variable specifications and health checks.
- Documented step-by-step Render and Atlas deployment procedure in `DEPLOYMENT.md`.
- Formulated hackathon demo accounts, student walkthrough script, architectural explanations, and judge defense answers.
- Updated all core documentation files (`README.md`, `PROJECT_STATUS.md`, `ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `API_DOCUMENTATION.md`, `DECISIONS.md`, `NEXT_AGENT.md`).

## 2026-11-06 — Phase 8 Cryptographic Skill Passport

- Implemented the Cryptographic Skill Passport backed by MongoDB `Credential` model.
- Integrated Ed25519 digital signature generation and verification (`.keys` and `.keys.pub`).
- Implemented deterministic SHA-256 evidence hashing over student ID, name, skill, assessment, result, previous hash, and timestamp.
- Established an append-only, tamper-evident cryptographic hash chain linking each credential to the previous credential's hash (`genesis` for the first).
- Added QR code generation (`createQrCodeDataUrl`) encoding verification URLs for mobile verification.
- Implemented authenticated `GET /credentials` (and `/passport` alias) displaying the student's passport and scannable QR verification codes.
- Implemented public verification endpoints `GET /verify/:id` and `GET /verify/preview` for independent verification of Ed25519 digital signatures and hash chain integrity.
- Automated credential issuance on passing guided quiz or practical coding assessments.
- Added comprehensive unit and integration tests covering signature verification, tampering detection, hash chain integrity, QR generation, authentication gating, and public verification.

## 2026-11-06 — Phase 7 SkillTrack (Git-inspired Learning History)

- Audited and verified the Git-inspired learning history architecture:
  - Repository = Student learning profile (`User`).
  - Commit = Completed assessment or milestone (`SkillTrackEntry`) with an 8-character commit hash.
  - Commit message = Achievement title.
  - Branch = Alternative learning or career path (e.g., `main`, `python-developer`).
  - Diff = Progress comparison between assessments (e.g. `+50% score improvement`, `Level advanced: beginner → intermediate`, or regression).
  - Tag = Verified milestone tag (e.g. `v1.0-...`).
  - Git log = Append-only chronological history.
- Built `services/skillTrackService.js` to calculate skill progress comparisons, normalize branch names, generate commit hashes, record assessment commits, and record milestone commits.
- Integrated assessments to commit history: both multiple-choice quizzes and coding assessments now automatically create immutable learning commits.
- Guaranteed historical record preservation: historical achievements are never silently overwritten; skill regressions generate explicit regression commits while preserving earlier achievements.
- Updated `/skilltrack` and `views/skilltrack/log.ejs` to display the Git-inspired log view with branch filtering, commit hashes, milestone tags, verification badges, diff indicators, and actual assessment records.
- Verified test suite: `npm test` passed 55/55; `npm audit --omit=dev` passed with 0 vulnerabilities; `git diff --check` passed.

## 2026-11-05 — Phase 1 Project Foundation

- Reconciled the architecture documentation with Phase 0/Phase 1 requirements,
  adding the MVP problem, planned user journey, feature breakdown, and
  database/security designs.
- Added `.env.example`, strengthened `.gitignore`, wired shared EJS site
  partials, and added foundation tests.
- Verified the app and health behavior, then later confirmed actual Atlas
  connectivity during Phase 2 validation.

## 2026-11-05 — Phase 0 Research and System Architecture

- Documented the MVP problem, target learner journey, conceptual feature
  breakdown, stack-compatible runtime architecture, and security/database
  design before product workflows were enabled.

## Existing workspace history

Feature-oriented services, route drafts, views, and PWA assets existed in the
workspace before these foundation changes. They remain unmounted drafts unless
listed as implemented above.
