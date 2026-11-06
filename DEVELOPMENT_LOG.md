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

## 2026-11-06 — Phase 7 SkillTrack

- Replaced the dormant in-memory SkillTrack view with authenticated
  `/skilltrack` GET/POST routes and a student-owned `SkillTrackEntry` MongoDB
  model. Learners can log a skill, current self-reported level, milestone
  title, and change summary; the server derives the previous level from that
  student's latest entry for the selected skill.
- The history page combines milestone entries with Phase 6 coding assessment
  progress and Phase 5 synchronized lesson completions. Each query is
  student-scoped and capped at 50 records; self-reported levels are explicitly
  distinguished from assessed skills and credentials.
- Added dashboard/navigation access, validation, persistence, history,
  ownership-isolation, and combined-source integration assertions. No Phase 8
  feature was started.
- `npm test` — 41 passed, 0 failed, 0 skipped. The Atlas integration verified
  milestone validation, persisted previous/current level transitions,
  student-only visibility, and aggregation with coding-assessment and offline
  lesson history.
- `ONLINECOMPILER_LIVE_TEST=true node --test test/app.test.js` — 14 passed,
  0 failed; the four-case Python submission passed at 100%, MongoDB result and
  SkillTrack records were verified and cleaned up.
- `npm audit --omit=dev` — 0 vulnerabilities. Changed route/model/test syntax
  checks and `git diff --check` passed.

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
