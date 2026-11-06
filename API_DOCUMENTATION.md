# API Documentation

The mounted HTTP surface includes student onboarding/profile flows, the
Career Navigator and skill assessments, the Vernacular Assistant, offline
lesson and progress-sync endpoints, and health probes. Credential and
recruiter route drafts are not mounted.

## Student authentication and profile

| Method and path | Behavior |
| --- | --- |
| `GET /` | Student onboarding landing page. |
| `GET /auth/register` | Registration and onboarding form. |
| `POST /auth/register` | Validates input, hashes the password, creates a MongoDB user, and starts a session. Success redirects to `/dashboard` with HTTP 303. |
| `GET /auth/login` | Login form. |
| `POST /auth/login` | Verifies password and starts a regenerated session. Success redirects to `/dashboard` or a safe same-origin return path. Invalid credentials return HTTP 401. |
| `POST /auth/logout` | Destroys the session and redirects to `/` with HTTP 303. |
| `GET /dashboard` | Signed-in student profile summary. Unauthenticated users are redirected to `/auth/login`. |
| `GET /profile` | Signed-in student's editable learning profile. |
| `POST /profile` | Validates and persists profile fields, then redirects to `/profile?saved=1`. Email and password cannot be changed here. |
| `GET /career` | Authenticated Career Navigator ranked from saved profile aspirations, interests, and skill inventory. |
| `GET /career?career=<slug>` | Focuses a known career path while retaining profile match details. Unknown slugs return the shared HTTP 404 page. |
| `GET /assessment` | Lists fixed-answer skill quizzes, the Python List Sum coding assessment, and recent attempts for the signed-in student. |
| `POST /assessment/:challengeId/submit` | Scores fixed multiple-choice answers, persists a `StudentAssessment`, and adds a passed skill reference to the student's verified skills. Requires CSRF. |
| `POST /assessment/:challengeId/submit-code` | Validates the fixed Python challenge, source size, consent, and idempotency key; sends code and fixed tests to OnlineCompiler.io; persists bounded results and SkillTrack progress. Requires student authentication, CSRF, explicit provider consent, and the configured server-side `ONLINECOMPILER_API_KEY`. |
| `GET /skilltrack` | Displays the signed-in student's self-reported milestones, persisted coding assessment progress, and synchronized offline lesson completions. |
| `POST /skilltrack` | Validates and stores a self-reported skill milestone. The prior level is derived from that student's latest milestone for the selected skill. Requires authentication and CSRF. |
| `GET /assistant` | Shows the authenticated learner's assistant form and current career/skill context. |
| `POST /assistant` | Returns Bengali/English guidance from a configured Gemini or OpenAI-compatible provider, or labeled offline mode. Requires CSRF; question length is 1–1,000 characters. |
| `GET /public/offline-learning.html` | Standalone offline lesson interface; its shell and lesson pack are pre-cached by the service worker. |
| `GET /learning/offline-pack` | Public, cacheable bilingual HTML/CSS/JavaScript lesson content. Does not create a session cookie. |
| `GET /learning/progress/state` | Authenticated learner's synced lesson slugs and a session-bound CSRF token. Response is private and no-store. |
| `POST /learning/progress/sync` | Syncs up to the packaged lesson completions. Requires authentication and `X-CSRF-Token`; repeated submissions are idempotent. |

Registration/profile fields include name, email, and a password of at least 10
characters (maximum 72 UTF-8 bytes) on registration,
preferred language, learning interests, career aspirations, current skills,
education level, learning preferences, access needs, and a short profile
summary. Career aspirations must match the configured career choices.
Preferred language is Bengali or English. State-changing form submissions
require a session-bound CSRF token.

The coding assessment currently supports one fixed Python list-sum challenge,
defined in server-side configuration; there is no challenge-authoring CRUD UI.
Submissions are limited to 8 KiB and three per student per minute per app
process. The provider applies its own plan quotas and sandbox limits; provider
failures are returned as safe user-facing errors. Submission keys prevent a
retried request from triggering duplicate execution. Provider responses are
bounded to 64 KiB and displayed output/error strings are capped at 1,200
characters. The database stores a SHA-256 source hash, provider submission ID,
score, verdict, and capped test results, but not the submitted source. Hidden
test outputs and errors are removed before persistence and display. Source
code and test inputs are sent to OnlineCompiler.io, whose Free-plan disclosure
states submissions are stored for up to 90 days; the form discloses this and
requires consent. The configured active REST API key is read only by the server; a widget key
cannot authenticate REST API calls.

This is a managed third-party execution integration, not a VidyaChain-hosted
gVisor runner. Provider sandbox claims and plan limits have not been
independently security-audited by VidyaChain. Phase 6 should not be described
as a self-hosted isolated runner or complete deployment. `ONLINECOMPILER_LIVE_TEST=true`
opts into the authenticated integration test that submits a harmless program
and verifies the MongoDB assessment and SkillTrack records. This test passed
on 2026-11-06 against four test cases; without this flag, tests mock the
provider.

The SkillTrack milestone form accepts a catalog skill, current level
(`beginner`, `intermediate`, or `advanced`), a 3-100 character title, and a
3-500 character change summary. The previous level is derived server-side from
the student's latest milestone for that skill, defaulting to `beginner`.
Milestone levels are learner-reported, not independently assessed or
credentials. The history page combines these entries with coding-assessment
progress and authenticated offline lesson completions, and shows at most the
latest 50 records of each type.

`services/catalogService.js` seeds `Career` and `Skill` reference records in
MongoDB. Career-skill mappings and skill prerequisites are ObjectId
relationships. Recommendations rank explicit aspirations, exact interest
tags, and listed or assessed skills. Roadmaps include missing prerequisites
in dependency order; the responsive SVG graph displays both relationship
types. The ranking is explainable and deterministic: an explicit career
aspiration contributes 100 points, skill coverage contributes up to 50 points,
and up to three exact interest-tag matches contribute 10 points each.
Recommendation results are not persisted.

The assistant provider is optional. For OpenRouter, configure `AI_API_KEY`,
`AI_API_URL=https://openrouter.ai/api/v1/chat/completions`, and `AI_MODEL`
with the exact model slug. For Gemini, configure `AI_API_KEY` and
`AI_API_URL` with a model-specific `:generateContent` endpoint; the model is
derived from the URL, so `AI_MODEL` is not needed. Other OpenAI-compatible
chat-completions endpoints also require `AI_MODEL`. Provider endpoints use
HTTPS (local HTTP is allowed for development). Without provider configuration,
the route returns offline profile-based guidance and labels it as non-AI. A
configured provider failure is surfaced as an error rather than silently
replaced by offline mode. Provider configuration or network failures return
HTTP 503 with a safe, user-facing explanation. OpenRouter model
`openai/gpt-4o` was live-verified with Bengali and English requests on
2026-11-06.

Offline completion sync accepts a JSON body such as:

```json
{
  "completedSkills": ["html", "css"],
  "baseCompletedSkills": ["html"]
}
```

Only slugs in the packaged lesson set are accepted. Unknown entries or more
than three entries return HTTP 400. `baseCompletedSkills` is the client's last
server snapshot; completions newly present on the server but absent from both
lists are returned in `conflicts` and preserved by the completion-wins merge.
A successful response includes `synced`, `completedSkills`, `conflicts`, and
`conflictResolution`. Browser-side completion and retry state remain in
IndexedDB when the account or network is unavailable.

The app-wide IP request limit is 100 requests per 15 minutes. Assistant
questions are limited to 1,000 characters; provider generation is limited to
450 output tokens and a 12-second request timeout.

## Health

### `GET /health/live`

Liveness probe; confirms the HTTP process is responsive independently of
MongoDB.

**Success — `200 OK`**

```json
{
  "status": "ok"
}
```

### `GET /health/ready`

Readiness probe; returns ready only when Mongoose is connected to MongoDB.

**Ready — `200 OK`**

```json
{
  "status": "ready",
  "database": "connected"
}
```

**Not ready — `503 Service Unavailable`**

```json
{
  "status": "not_ready",
  "database": "disconnected"
}
```

Unknown routes return an HTML 404 page. Missing/invalid CSRF tokens return
HTTP 403. Invalid JSON requests return HTTP 400, and bodies above the 10 KB
limit return HTTP 413. Unexpected server errors return a generic HTML 500 page
without exposing exception details.
