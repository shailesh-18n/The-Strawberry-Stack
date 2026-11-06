# Next Agent

## Current phase and boundary

Phases 0–7 are verified. Phase 6 has a limited coding-assessment MVP using
OnlineCompiler.io for remote Python execution, MongoDB persistence, and
SkillTrack assessment progress. The server-side key, consent, request
validation, rate limit, idempotency, hidden-test result suppression, and
source-hash-only persistence are implemented. The live provider/MongoDB test
passed after the user updated the local ignored `.env` with an active REST API
key. `ONLINECOMPILER_LIVE_TEST=true node --test test/app.test.js` passed 14/14;
the harmless sum program passed all four cases, and MongoDB assessment,
SkillTrack, and assessed-skill persistence were checked before test cleanup.
Never print or request the key itself.

This is not a VidyaChain-hosted gVisor runner. Provider sandbox and data
retention claims are not independently audited. Render and Oracle are still
unprovisioned; `render.yaml` is only a Blueprint and there is no separate
runner. Read `DEPLOYMENT.md` and `PHASE6_EXECUTION_ARCHITECTURE.md` for
limitations. Phase 7 SkillTrack is implemented as documented below. Do not
begin Phase 8.

## Completed Phase 2 behavior

- Students can register/log in/out; passwords are bcrypt-hashed, MongoDB
  sessions persist, session IDs rotate, and state-changing forms require CSRF.
- Profiles persist language, interests, career aspirations, current skills,
  education, preferences, access needs, and summary. Invalid profile updates
  return validation errors without saving.

## Completed Phase 3 behavior

- MongoDB `Career` and `Skill` models use references for career skill maps and
  skill prerequisite relationships. Startup seeds reference records
  idempotently.
- Authenticated `GET /career` ranks paths from explicit aspirations,
  structured interest tags, listed skills, and passed assessment references.
  It shows gap percentages and a prerequisite-aware ordered roadmap. Unknown
  career slugs show the shared 404 page.
- `StudentAssessment` attempts persist in MongoDB; passing an assessment adds
  its referenced skill to the verified student skill set used in matching.
- The responsive, accessible SVG graph shows career-skill and skill-prerequisite
  edges. Recommendations are deterministic, not AI output.

## Completed Phase 4 behavior

- Authenticated `/assistant` supports Bengali and English, CSRF, and a
  1,000-character question limit.
- OpenRouter uses `AI_API_URL=https://openrouter.ai/api/v1/chat/completions`
  and requires the exact model slug in `AI_MODEL`; the user supplied
  `openai/gpt-4o`. Gemini `:generateContent` URLs instead derive the model
  from the URL and do not require `AI_MODEL`. Live profile-context requests to
  OpenRouter returned AI-mode answers in Bengali and English; Bengali script
  was present and the key was not present in either response. The ignored
  `.env` was updated with the model slug; the API key was not changed or
  printed.
- Provider errors are surfaced; they do not silently become offline responses.
- The Atlas integration test clears and restores AI settings around its
  offline-mode assertion so local provider configuration cannot make the test
  depend on the remote AI service. Rerun `npm test` and `npm audit` after any
  edits.

## Completed Phase 5 behavior

- `/public/offline-learning.html` provides three bilingual foundational
  lessons (HTML, CSS, JavaScript), exercises, self-check prompts, and
  interactive offline quizzes.
- The service worker pre-caches only the static lesson shell/assets and the
  public lesson pack under root scope. It never caches private pages or
  progress APIs and removes prior VidyaChain caches on activation.
- IndexedDB stores completed slugs, the pending sync queue, and the last server
  snapshot. Authenticated, CSRF-protected `/learning/progress/sync` is
  idempotent per student/skill; completion-wins merging preserves concurrent
  completions and reports conflicts. `/learning/progress/state` is
  private/no-store.
- A Chromium browser test with network emulation set offline verified
  `navigator.onLine === false`, cached lesson reload, correct quiz feedback,
  IndexedDB queuing, reconnection sync to Atlas, and a concurrent CSS
  completion merged during a paused JavaScript sync. Final IndexedDB and Atlas
  state contained HTML, CSS, and JavaScript with no pending slugs.
- Chrome 156.0.8078.80 had no manifest/installability errors and showed its
  native install prompt. VidyaChain was installed in a dedicated test profile
  and launched in a standalone window (`display-mode: standalone`); its
  service worker controlled the window and displayed all three lessons.
- The Chromium offline test verified cached reload, quiz feedback, IndexedDB
  queuing, reconnection sync, and concurrent completion merge. Atlas-backed
  integration verifies duplicate-sync idempotence. Phase 5 verification
  passed.
- Assessments, AI generation, account features, and cloud sync remain
  online-only. The pack contains only three lessons. No project dependencies
  were added for Phase 5.

## Phase 6 Practical Assessment Engine — MVP status

- The fixed Python List Sum challenge sends source and fixed test inputs to
  OnlineCompiler.io only after consent. Express never evaluates submitted
  code. The challenge is server-defined; there is no authoring UI/CRUD.
- `StudentAssessment` stores score/verdict/test summaries, provider ID, and
  source hash; raw source and hidden expected outputs are not stored. A unique
  per-student submission key prevents duplicate provider execution. Passing
  adds the Python skill and creates one `SkillTrackProgress` record.
- Run `ONLINECOMPILER_LIVE_TEST=true npm test` in an environment where `.env`
  contains a valid `ONLINECOMPILER_API_KEY` and Atlas is reachable. The test
  submits only a harmless sum program and verifies four test results plus both
  MongoDB records; it removes its temporary records afterward. Do not print
  the key or provider request headers.
- The standard test suite mocks provider calls; its explicit live-test flag
  submits only the harmless fixed sum program. Provider quotas and isolation
  are external; do not claim VidyaChain independently verified the sandbox.
- No self-hosted gVisor runner, Oracle VM, Render service, or private
  app-runner channel exists.

## Phase 7 SkillTrack — implemented

- `/skilltrack` is authenticated and displays only the signed-in student's
  self-reported milestones, coding assessment progress, and synchronized
  offline lesson completions. Each section is capped at the latest 50 rows.
- `POST /skilltrack` validates a catalog skill, a supported learner-reported
  level, title, and summary; CSRF is enforced by the app middleware. The
  server derives the previous level from that student's latest entry for the
  selected skill (default `beginner`).
- `SkillTrackEntry` stores milestone history. These self-reported levels are
  not verified skills or credentials; do not treat them as one.
- Atlas integration tests cover invalid form data, successive level changes,
  persisted history, and isolation from another student's record.
- No Phase 8 credentials/recruiter work has started. Wait for explicit
  approval before proceeding.

## Known repository/security issue

The current tracked working tree contains no detected database URI,
private-key block, AWS key, or bcrypt hash; `.env`, `.keys`, and `.keys.pub`
are ignored and untracked. The initial commits `2e2037f` and `78d5825` retain
the old fixed bcrypt hash for the dormant Vivek Das demo account. Its plaintext
password was not found, and cracking was not attempted. A targeted rewrite
before publication is an option, but do not rewrite history without explicit
user approval. The repository has a configured `origin` remote; inspect the
full working tree before any push.

The old account data is an in-memory sample, and the route that creates it is
not mounted. The hash is not a database password, session secret, or private
key, but it does expose an offline password verifier tied to a known demo
identity. Treat it as unsuitable for reuse or publication until history is
reviewed.

## DNS resolver

The app uses system DNS unless optional `DNS_SERVERS` contains a comma-
separated list of resolver IPs. The local ignored `.env` currently specifies
Google Public DNS because the system resolver timed out on Atlas SRV records
in this environment. Keep the application default portable; do not re-add a
hard-coded resolver.

## Retained constraints

- Keep the approved HTML5, CSS3, Bootstrap 5, EJS, vanilla JavaScript, Node.js,
  Express, MongoDB, and Mongoose stack.
- Do not introduce React, Next.js, TypeScript, or other unapproved frameworks.
- Keep credentials and recruiter tools out of scope. The requested hosting
  setup is still blocked on cloud-account provisioning access. Do not execute
  untrusted code in Express, and do not begin Phase 8.
- Keep secrets and generated signing keys outside Git; never execute untrusted
  assessment code in the Express process.

## Deployment handoff

- The root `render.yaml` is a non-secret Render Blueprint (Node, Singapore,
  Free web plan, `npm ci`, `npm start`, readiness check, Render-generated
  session secret, manual Atlas URI). Automatic deploy is disabled.
- `DEPLOYMENT.md` records that no live deployment was created or verified.
  This session had no Render API credential/CLI or OCI config/CLI/SSH access.
  GitHub CLI access does not grant Render or Oracle Cloud authorization.
- The repo has an `origin` remote and a substantially modified, uncommitted
  working tree. Review the complete diff before pushing or deploying; do not
  push these changes wholesale without explicit user review.
- Render Free cannot receive private network connections. If Phase 6 runner
  work is approved, use an Oracle-initiated outbound HTTPS polling channel
  with authenticated, replay-resistant broker messages. Keep all runner
  execution ports closed to public ingress. No broker or runner exists yet;
  do not claim secure communication until the implementation and live checks
  pass.
