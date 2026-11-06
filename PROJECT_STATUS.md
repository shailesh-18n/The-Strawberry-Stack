# Project Status

## Completed phases

- **Phase 0 — Research and System Architecture:** MVP problem, planned
  journey, stack-compatible architecture, database/security designs, and
  feature breakdown are documented.
- **Phase 1 — Project Foundation:** Node.js/Express, EJS, Bootstrap 5,
  Mongoose connection lifecycle, environment configuration, security/error
  middleware, shared layouts, landing page, and health probes are implemented.
- **Phase 2 — Student Interface and Onboarding:** Registration, login,
  language/career-interest selection, MongoDB-backed student profile create
  and update, dashboard, Mongo-backed sessions, and CSRF protection are
  implemented and tested.
- **Phase 3 — Skill Graph and Career Navigator:** Authenticated,
  MongoDB-backed career and skill models, prerequisite relationships,
  career-to-skill mapping, structured profile-driven ranking, skill-gap
  analysis, personalized prerequisite-aware roadmaps, graph, and persisted
  skill assessment results are implemented and tested.
- **Phase 4 — Vernacular AI Assistant:** Authenticated Bengali/English
  guidance uses saved career/skill context, supports a configurable
  Gemini `generateContent` endpoint (model derived from its URL) or
  OpenAI-compatible provider, and transparently falls back to local
  profile-based guidance when no provider is configured. Live OpenRouter
  requests using model `openai/gpt-4o` were verified in both Bengali and
  English.
- **Phase 5 — Offline-First Learning:** Three bilingual HTML, CSS, and
  JavaScript micro-lessons with quizzes are cached for offline use. IndexedDB
  stores completions and queued sync state; authenticated synchronization is
  idempotent and uses completion-wins merging for concurrent completions. The
  service worker never caches private app pages or progress APIs. Chrome
  desktop native installation and standalone launch were verified.
- **Phase 6 — Practical Assessment Engine:** A limited MVP now provides a
  fixed Python list-sum coding challenge, server-side validation and
  rate-limiting, OnlineCompiler.io API execution, bounded test-result display,
  idempotent MongoDB assessment persistence, and SkillTrack progress records.
  The API key remains server-side and the form requires consent before source
  is sent to the provider. This is a third-party managed execution integration,
  not a self-hosted gVisor runner; provider sandbox claims have not been
  independently audited. The live provider/MongoDB path has been verified
  with four passing test cases, a persisted `StudentAssessment` and
  `SkillTrackProgress` record, and the assessed Python skill; test records were
  cleaned up. Render and Oracle remain unprovisioned.
- **Phase 7 — SkillTrack:** Git-inspired learning history model is fully implemented
  and verified: Repository = Student learning profile; Commit = Completed assessment
  or milestone with 8-character commit hash; Commit message = Achievement title;
  Branch = Learning or career path; Diff = Progress comparison between attempts;
  Tag = Verified milestone; Git log = Append-only chronological history.
  Assessment-to-commit integration creates immutable commits for guided quiz and
  coding submissions. Progress diffs explicitly calculate score/level improvement
  and regression. Historical records are preserved and never silently overwritten.
  The SkillTrack UI renders commits with branch selectors, tags, verification
  badges, diff banners, and actual assessment records.
- **Phase 8 — Cryptographic Skill Passport:** Cryptographically signed,
  tamper-evident credentials use Ed25519 asymmetric signatures, deterministic
  SHA-256 evidence hashing, and an immutable cryptographic hash chain linking
  each credential to the previous credential's hash (`genesis` for the first).
  Persistent Mongoose `Credential` model stores issued credentials with unique
  idempotency keys and QR codes. Authenticated `GET /credentials` (and `/passport`
  alias) displays the student's passport and scannable QR verification codes.
  Public `GET /verify/:id` and `GET /verify/preview` endpoints independently
  verify Ed25519 digital signatures and hash chain integrity.
- **Phase 9 — Opportunity Matching and Recruiter Dashboard:** Practical internship
  matching links student profiles to real-world opportunities. Matching engine
  weights required skills (75%) and preferred skills (25%), differentiating verified
  assessed skills (1.0 weight) from self-reported skills (0.8 weight). Highlights
  missing skills and provides actionable roadmap recommendations. Recruiter Dashboard
  (`GET /recruiter`) enables candidate talent pool discovery, skill filtering,
  and credential validation. Student Skill Portfolio (`GET /portfolio/:id`) showcases
  verified credentials, milestone commits, and privacy controls (`POST /portfolio/privacy`).
- **Phase 10 — Integration and Quality Assurance:** Comprehensive end-to-end student
  journey verified: Registration → Career selection → Skill assessment → Skill-gap
  analysis → Learning roadmap → Bengali AI assistant → Python coding assessment →
  SkillTrack → Credential generation → QR verification → Offline learning →
  Opportunity matching → Recruiter dashboard. Verified with full MongoDB persistence,
  strict idempotency, and error recovery.
- **Phase 11 — Deployment and Hackathon Readiness:** Render Blueprint configuration
  (`render.yaml`) prepared and validated with environment variable specifications
  (`MONGODB_URI`, `ONLINECOMPILER_API_KEY`, `AI_API_KEY`, `AI_API_URL`, `DNS_SERVERS`).
  Atlas connection verified with SRV resolution. Production security checklist,
  demo accounts (`demo.student@vidyachain.app`, `recruiter@vidyachain.app`), demo
  walkthrough script, architecture talking points, and judge Q&A prepared.

## Verification

Verification last updated 2026-11-06:

- The complete Phase 0–11 test suite `npm test` passed: **58 passed, 0 failed, 0 skipped**.
  Coverage spans Atlas catalogue seeding, student profile, career recommendation,
  assistant guidance, offline PWA synchronization, coding assessment, Git-inspired SkillTrack
  regression/diff checks, Cryptographic Skill Passport Ed25519 signing/verification/tamper detection,
  and Opportunity Matching algorithms.
- The first live attempt was rejected because the old configured API key was
  invalid/inactive. After the user updated the ignored local `.env` with an
  active REST API key, `ONLINECOMPILER_LIVE_TEST=true node --test
  test/app.test.js` passed **14/14**. The harmless Python solution passed all
  four provider cases at 100%; MongoDB assessment and SkillTrack persistence
  and assessed-skill updates were verified, then temporary records were
  cleaned up. No key was printed or returned to the browser.
- The app does not execute submitted source in Express. The managed provider
integration suppresses hidden-test outputs, stores only a source hash, and
requires consent. The provider's actual sandbox, quotas, and retention
policies are not independently verified here. The MVP has one server-defined
challenge and no challenge-authoring UI; it uses deterministic test-case
evaluation, not AI-based scoring.
- Phase 5 PWA install verification in Chrome 156.0.8078.80: manifest had no
  parse/installability errors, Chrome displayed its native install prompt,
  installation completed in an isolated test profile, and Chrome launched the
  lesson page in a separate window with standalone display mode. The service
  worker controlled that window and all three lesson cards were available.
- Offline mode was verified in Chromium with network emulation disabled:
  the cached lesson page and pack reloaded offline, the HTML quiz returned the
  correct result, and IndexedDB queued completion. After reconnect, progress
  synced to Atlas. Atlas-backed integration coverage verifies duplicate sync
  idempotence and completion-wins conflict merging.
- `npm audit` — 0 vulnerabilities.
- Direct Mongoose Atlas connection using the application's configured
  `DNS_SERVERS` resolver — succeeded; connection state was ready. A diagnostic
  attempt that omitted resolver configuration timed out on Atlas SRV lookup,
  consistent with the system-DNS limitation below.
- Live startup seeding verified 3 careers and 20 skills in Atlas; follow-up
  checks found 0 temporary Phase 2 test accounts or assessment attempts.
- Atlas SRV lookup timed out with the system resolver in this environment and
  succeeded with the optional Google Public DNS setting in ignored local
  `.env`. The application default now uses system DNS; `DNS_SERVERS` is an
  optional validated setting.
- Live `node server.js` smoke test against Atlas — `/`, `/auth/register`, and
  `/health/ready` returned HTTP 200; the onboarding form contained a CSRF token
  and career choices.
- Production cookies use `secure`; `SESSION_SECRET` is required and must be at
  least 32 characters.
- Test-created student account is deleted after the integration test. User
  profile documents and session records persist in MongoDB during normal use.
  The integration test removes its temporary assessment records, offline
  completion records, and user in `finally`.

Phase 2 audit coverage verifies registration, login/logout, authentication
gating, CSRF, rejected invalid profile updates, language/career/skill
selection, MongoDB persistence, and Bootstrap responsive layout markers. The
Atlas integration test uses an ephemeral unique account and removes it in a
`finally` block.

Phase 3 stores `Career`, `Skill`, and `StudentAssessment` records in MongoDB.
Career skills and skill prerequisites are ObjectId references. The startup
catalog seeder idempotently maintains reference data. Recommendations use
explicit profile aspirations, exact structured interest tags, assessed skill
references, and case-insensitive manual skill entries. Roadmaps topologically
order missing prerequisite chains; the SVG graph displays career mappings
and prerequisite edges. No new dependency was added.

Phase 4 assistant requests are authenticated, CSRF-protected, and limited to
1,000 characters. The app-wide IP rate limiter allows 100 requests per
15-minute window; AI replies are capped at 450 output tokens and requests
time out after 12 seconds. Gemini model-specific `:generateContent` URLs derive their
model without requiring `AI_MODEL`; OpenAI-compatible endpoints require
`AI_MODEL`. Mocked tests cover both request formats, server-side key handling,
context minimization, and provider failures. On 2026-11-06, the configured
OpenRouter endpoint was safely identified as `/api/v1/chat/completions` with
no model in its URL. The user supplied model slug `openai/gpt-4o`; it was added
to ignored `.env` without changing the API key. Real profile-context requests
returned AI-mode answers in Bengali and English, the Bengali answer contained
Bengali script, and neither answer contained the API key. The Atlas-backed
integration test explicitly clears provider environment variables for its
offline-assistant assertion, then restores them.

Phase 5 packages bilingual HTML, CSS, and JavaScript lessons and quizzes into
a cacheable public pack and a standalone offline lesson page. The root-scoped
service worker pre-caches only that shell, its local assets, and the public
pack; it never caches authenticated HTML or progress state. IndexedDB stores
local completions, a retry queue, and the last server snapshot. Sync is
idempotent; if a completion arrives on the server after that snapshot,
completion-wins merging preserves both copies and reports the conflict.
MongoDB stores synced lesson completions in `learningprogress`, uniquely keyed
by student and skill. The offline pack currently covers only three skills;
AI generation, guided assessments, account features, and cloud sync are
online-only.

Browser verification confirmed root-scope service-worker control, cached
lesson assets, and in Chromium network-offline mode (`navigator.onLine` false)
an offline reload, correct quiz result, and queued IndexedDB completion. After
reconnection, the completion synchronized to Atlas; a concurrent Atlas CSS
completion was preserved and merged by the browser client, with no pending
slugs left. Atlas-backed tests verify duplicate sync idempotence. The
manifest, root scope, and 192/512 PNG icons were verified. Chrome
156.0.8078.80 reported no manifest/installability errors; the native install
prompt was confirmed, accepted in a dedicated test profile, and launched
VidyaChain in a standalone window (`display-mode: standalone`). **Phase 5
verification passed.**

## Current boundary

Phases 0–11 are fully completed and verified. VidyaChain's end-to-end vision is
implemented across student onboarding, career navigation, vernacular AI guidance,
offline micro-learning, practical coding assessments, Git-inspired SkillTrack history,
the Cryptographic Skill Passport with QR verification, opportunity matching for
internships, and the Recruiter Dashboard with privacy controls. Ready for hackathon
showcasing and production deployment.

## Database

Mongoose stores student and recruiter accounts in `users`, career catalogue records in
`careers`, structured skills and prerequisites in `skills`, assessment attempts in
`studentassessments`, assessment progress in `skilltrackprogress`, Git-inspired learning
history commits in `skilltrackentries`, offline lesson completions in `learningprogress`,
cryptographic credentials in `credentials`, internship opportunities in `opportunities`,
and Express sessions in `sessions`. Recommendation results and assistant conversations
are computed at request time and are not persisted.

## Git and credential status

The repository is on branch `master` with a modified working tree and an
`origin` GitHub remote. `.env`, `.keys`, and `.keys.pub` are ignored and not tracked.
The current tracked working tree has no detected MongoDB credential URI,
private-key block, AWS key, or bcrypt hash. The initial commits `2e2037f` and
`78d5825` both contain the same fixed bcrypt hash in the `seedDemoUser` sample
account for Vivek Das (`vivek@vidyachain.app`). No plaintext password was
found in source or commit messages, so whether its original password was
predictable cannot be determined from the hash alone; password cracking was
not attempted. The account route is a dormant in-memory draft, not mounted in
the current app. The hash was replaced in the current working tree by a
runtime-generated unusable value. No history rewriting was performed. Before
publishing, make a private Git bundle backup and consider a targeted
`git-filter-repo` replacement of the historical hash, then verify every
publishable ref from a fresh clone. Obtain explicit approval first because
history rewriting is destructive.
