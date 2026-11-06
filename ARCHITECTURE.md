# Architecture

## Product problem and MVP

VidyaChain helps students connect learning interests and career goals. The MVP
aims to make learning progress understandable: students create a profile,
identify preferred language and career interests, then follow a skill-building
journey. The implemented product slices are student registration, onboarding, profile
updates, a profile-driven Career Navigator with skill gaps and a skill graph,
structured skill assessments, a vernacular learning assistant, and offline
foundational lessons with local progress and authenticated synchronization.
Credentials and recruiter verification remain outside the completed phases.

The planned user journey is:

1. A learner visits the landing page and creates an account with their name,
   email, and password.
2. During registration the learner selects Bengali or English, learning
   interests, career aspirations, and optional education, skills, learning
   preferences, access needs, and profile summary.
3. The learner views a dashboard and can update the profile at any time.
4. The learner explores career paths ranked against profile interests,
   aspirations, and listed skills, and reviews a suggested learning roadmap.
5. The learner can check a skill with a guided assessment, then ask for
   Bengali or English learning guidance based on the saved profile.
6. The learner downloads foundational lessons, studies offline, and syncs
   completed lesson progress when signed in and connected.

## Feature breakdown

| Area | Capability | Current status |
| --- | --- | --- |
| Project foundation | Express server, EJS, Bootstrap styling, configuration, security middleware, health checks | Implemented and tested in Phase 1 |
| Student onboarding | Registration, login, language/career-interest selection, persistent profile create/update | Implemented and tested in Phase 2 |
| Career navigation | Structured ranking, career focus, skill gaps, dependency-aware roadmap, responsive graph | Implemented and tested in Phase 3 |
| Learning guidance | Profile-context Bengali/English assistant, optional Gemini/OpenAI-compatible provider and offline guidance | Implemented and live-verified with OpenRouter in Bengali and English |
| Skill assessment | Fixed-answer questions, persisted attempts, assessed skill references | Implemented and tested in Phase 3 |
| Practical coding assessment | Fixed Python list-sum challenge, OnlineCompiler.io multi-case execution, bounded result persistence and SkillTrack record | Managed provider integration live-verified against four cases; no VidyaChain-hosted gVisor runner; provider claims not independently audited |
| Offline learning | Cached bilingual HTML/CSS/JavaScript lessons and quizzes, IndexedDB completion queue, authenticated conflict-aware sync | Verified in network-offline Chromium and installed/ launched as a native Chrome desktop PWA |
| Hosting | Render Node web service, MongoDB Atlas, separate Oracle Cloud runner | Render Blueprint prepared; no cloud service or runner is deployed |
| SkillTrack | Git-inspired learning history: Repository (profile), Commit (assessment/milestone), Branch (career path), Diff (comparison), Tag (milestone), Git log (timeline) | Implemented and verified in Phase 7 |
| Credentials | Cryptographic Skill Passport: Ed25519 asymmetric signatures, SHA-256 evidence hashing, hash chaining, QR verification, student passport view, public verification | Implemented and verified in Phase 8 |
| Opportunity Matching | Deterministic matching (75% required / 25% preferred, verified 1.0 vs reported 0.8), missing skill suggestions, internship listings | Implemented and verified in Phase 9 |
| Recruiter Dashboard | Candidate discovery pool, verified skill filtering, student skill portfolio view, portfolio privacy controls | Implemented and verified in Phase 9 |
| End-to-End Integration | Full student journey across all services with MongoDB persistence and live API testing | Implemented and verified in Phase 10 |
| Deployment & Hackathon Readiness | Render Blueprint (`render.yaml`), Atlas configuration, demo accounts, demo script, judge Q&A | Implemented and verified in Phase 11 |

## Student and Career Navigator request flow

```text
Browser
  -> Express app (app.js)
     -> Helmet CSP + request rate limiter + body limits
     -> EJS static assets
     -> express-session with MongoDB store
     -> session-bound CSRF validation for state-changing requests
     -> mounted routes
        -> Landing page
        -> Registration/login/logout -> bcrypt + Mongoose User model
        -> Student dashboard/profile -> authenticated Mongoose User
        -> Authenticated career navigator -> deterministic ranking + SVG graph -> authenticated Mongoose User
        -> Skill assessments -> fixed-answer or OnlineCompiler.io result -> StudentAssessment + SkillTrackProgress -> assessed skill refs on pass
        -> SkillTrack -> Git-inspired commit log, career-path branches, assessment commits, diffs
        -> Skill Passport (/credentials, /passport) -> Ed25519-signed credentials + QR codes
        -> Public verification (/verify/:id, /verify/preview) -> Ed25519 signature & hash chain verification
        -> Opportunity matching (/opportunities) -> deterministic ranking, gap analysis, improvement recommendations
        -> Recruiter Dashboard (/recruiter) -> talent search, candidate portfolio view (/portfolio/:id), privacy controls (/portfolio/privacy)
        -> Vernacular assistant -> profile context -> configured AI endpoint or offline guidance
        -> Offline lessons/quizzes -> service-worker cache + IndexedDB queue -> authenticated sync/merge -> LearningProgress
        -> Health probes
  -> MongoDB connection and reference catalogue seeding (config/db.js, catalogService.js, opportunityService.js)
```

## Structure

```text
app.js
server.js
config/
  db.js
controllers/
  homeController.js
middleware/
  csrfProtection.js
  errorHandler.js
  notFound.js
  requireStudentAuth.js
  security.js
models/
  Career.js
  LearningProgress.js
  Skill.js
  StudentAssessment.js
  User.js
routes/
  assessment.js
  auth.js
  health.js
  index.js
  student.js
  career.js
  learning.js
  app.js            # existing later-phase draft; not mounted
services/           # existing later-phase feature drafts
  offlineLearningService.js
utils/
  studentProfile.js # profile parsing and validation
  store.js          # legacy in-memory feature drafts only
views/
  auth/
  errors/
  partials/
  student/
public/
  css/
    offline-learning.css
  js/
    offline-learning.js
  offline-learning.html
  manifest.json
  sw.js
test/
```

`app.js` composes middleware and routes without opening the primary Mongoose
connection. `server.js` owns startup, database connection, catalogue seeding,
listener lifecycle, and shutdown. Mongoose stores structured career and skill
records; the career service deterministically ranks them against the student
profile. The assistant sends only preferred language, career/skill context,
and the learner's question to a configured provider. Without provider
configuration it uses a clearly labeled local response. Express sessions use
a MongoDB-backed store when `MONGODB_URI` is configured.

## Database design

MongoDB with Mongoose stores student accounts in `users`, career catalogue
records in `careers`, structured skills and prerequisite references in
`skills`, assessment attempts in `studentassessments`, offline completions in
`learningprogress`, and sessions in `sessions`. Career recommendations and
assistant conversations are computed per request and are not persisted. See
[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).

## Security design and runtime boundaries

- Helmet applies browser security headers with a Content Security Policy that
  allows only the app and the Bootstrap CDN.
- Express rate-limits requests and limits JSON/form bodies to 10 KB.
- Student passwords are hashed with bcrypt; the password hash is excluded from
  normal Mongoose query selection and is never rendered.
- Registration/login regenerate the session ID. Session cookies are HTTP-only,
  same-site, and secure in production. Configured sessions are persisted in
  MongoDB.
- State-changing browser requests require a cryptographically random,
  session-bound CSRF token checked with a timing-safe comparison.
- `SESSION_SECRET` must contain at least 32 characters. Keep `.env` and
  generated credential signing keys out of Git.
- MongoDB Atlas SRV resolution uses the operating system's DNS configuration
  by default. An optional, validated comma-separated `DNS_SERVERS` setting can
  select resolver IPs when a network's default resolver cannot resolve Atlas
  records. Keep resolver choices in ignored `.env`, not application source.
- Fixed-answer skill assessments remain available. The coding assessment
  sends consented source to OnlineCompiler.io; the web process does not run
  student code. This is a managed-provider integration, not a VidyaChain-hosted
  gVisor runner, and provider claims are not independently audited.
- The Phase 6 self-hosted gVisor proposal and security test matrix are retained
  in [PHASE6_EXECUTION_ARCHITECTURE.md](PHASE6_EXECUTION_ARCHITECTURE.md).
  Render/Oracle deployment, a separate runner, and app-to-runner communication
  are not implemented or verified.
- Render Free cannot receive private-network connections. A future Oracle
  runner must initiate an authenticated outbound HTTPS connection to an
  application broker. No broker/channel has been implemented or verified;
  deployment constraints are in [DEPLOYMENT.md](DEPLOYMENT.md).
- AI provider credentials are server-side environment variables and are never
  included in rendered HTML or provider request context.
- The service worker caches only the public offline lesson shell, its local
  assets, and the public lesson pack. Authenticated pages and progress API
  responses are never written to Cache Storage. Offline completion records
  contain only lesson slugs in IndexedDB; sync requires authentication and
  CSRF. A completion-wins merge preserves updates made concurrently on another
  device. AI generation, guided assessments, account features, and cloud sync
  remain online-only.

## Completed architecture and deferred infrastructure

Phases 0 through 11 are implemented and verified. The platform features an end-to-end
functional journey: onboarding, career navigation, vernacular AI assistance, offline
PWA learning, coding assessments via managed sandbox, Git-inspired SkillTrack history,
the Cryptographic Skill Passport with QR codes and independent verification, opportunity
matching for internships, and a recruiter dashboard with privacy controls.

Deferred infrastructure items include:
- A dedicated self-hosted gVisor execution runner on Oracle Cloud (currently using the
  managed OnlineCompiler.io REST API for coding assessments).
- Automated enterprise ATS webhook integrations beyond the MVP recruiter portal.
