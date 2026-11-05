# Architecture

## Product problem and MVP

VidyaChain is intended to help students, especially learners who benefit from
step-by-step and vernacular guidance, connect career goals to practical skills.
The MVP aims to make that path understandable and measurable: learners describe
their interests and goals, receive a career roadmap, practice skills, track
progress, and share evidence of achievement.

The MVP product journey is:

1. A learner visits the public landing page and creates a student profile with
   their interests, aspirations, education, preferred language, and learning
   or access needs.
2. The learner reviews a suggested career path, the skills needed for it, and
   an ordered learning roadmap.
3. The learner gets guidance while working through the roadmap and completes
   practical skill assessments.
4. Assessment outcomes update a learner-visible progress history; eligible
   achievements can be issued as credentials.
5. A learner shares a credential with a recruiter or other verifier, who checks
   its issuer and integrity.

This is the planned product journey, not a claim that those workflows are
currently operational. The deployed Phase 1 scope is the application
foundation; Phase 2 is student interface and onboarding.

## Feature breakdown

| Area | Planned capability | Current status |
| --- | --- | --- |
| Project foundation | Express server, EJS views, Bootstrap styling, configuration, security boundary, health checks | Implemented and tested in Phase 1 |
| Student onboarding | Student registration/profile and onboarding flow | Planned for Phase 2 |
| Career navigation | Recommendations, skill gaps, and learning roadmap | Existing draft only; not mounted |
| Learning guidance | Contextual, language-aware learner guidance | Existing draft only; not mounted; no external AI integration verified |
| Skill assessment | Practical challenges and recorded results | Existing draft only; not mounted |
| Progress tracking | Learner-visible milestones and history | Existing draft only; not mounted |
| Credentials | Signed achievement records and public verification | Existing draft only; not mounted |
| Recruiter tools | Credential inspection and verification | Existing draft only; not mounted |

The feature inventory is grounded in the existing route and view drafts. Product
behavior, sequencing beyond Phase 2, and integrations remain subject to the
master prompt and future phase approval.

## Phase 1 request flow

```text
Browser
  -> Express app (app.js)
     -> Security middleware (Helmet CSP + rate limiter)
     -> Phase 1 routes
        -> Home controller -> EJS foundation view and shared site partials
        -> Health controller -> JSON
     -> Static files (/public/*)
  -> MongoDB connection managed by Mongoose (config/db.js)
```

## Structure

```text
app.js
server.js
config/
  db.js
controllers/
  homeController.js
  healthController.js
middleware/
  security.js
  errorHandler.js
  notFound.js
models/             # reserved for confirmed Mongoose schemas
routes/
  index.js
  health.js
  app.js            # existing feature routes; not mounted in Phase 1
  auth.js           # existing feature routes; not mounted in Phase 1
services/           # existing feature-oriented drafts
utils/              # existing demo store
views/
  foundation.ejs
  partials/
    site-header.ejs
    site-footer.ejs
  errors/
public/
  css/
  js/
  manifest.json
  sw.js
test/
```

Controllers own HTTP request/response behavior. Routes map URLs to controllers.
Services will hold reusable business logic once product requirements are
confirmed; models will define Mongoose schemas in the corresponding product
phase. `app.js` composes middleware and Phase 1 routes without opening network
or database connections. `server.js` owns startup, database connection,
listener lifecycle, and shutdown.

## Runtime and trust boundaries

- Express serves the Phase 1 EJS app and static assets from `public/` under `/public`.
- Helmet applies browser security headers with a Content Security Policy restricted to the app and the jsDelivr Bootstrap CDN.
- Express rate limiting and 10 KB JSON/form body limits apply at the app boundary.
- MongoDB is accessed through Mongoose. Database readiness is separate from process liveness.
- Configuration is read from environment variables; `.env` is local-only and excluded from version control.
- Existing feature routes, authentication, and in-memory demo services are not wired into the Phase 1 app.

## Database design

MongoDB with Mongoose is the planned persistence layer. The current foundation
opens a Mongoose connection when `MONGODB_URI` is configured, but defines no
product models or collections. The conceptual entities and relationships are
listed in [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md); schemas, indexes, validation,
and retention rules must be confirmed before product persistence is added.

## Security design

The foundation applies Helmet security headers and a restrictive Content
Security Policy, rate-limits requests, limits JSON/form bodies to 10 KB, masks
unexpected HTTP errors, and keeps secrets in environment configuration.
Production deployment must use HTTPS and a strong secret-management process.

Before student accounts are implemented, authentication must use a secure
password hash, protected sessions, authorization checks, and CSRF protection
for state-changing browser forms. Credential signing keys must remain private
and outside source control. Any assessment code execution must be isolated from
the Express process with explicit resource limits. Those product controls are
design requirements, not implemented Phase 1 features.

## Deferred design

Authentication, authorization, domain entities, persistence semantics, and business APIs are deferred to their approved product phases. The feature drafts are not wired into Phase 1. Keep assessment code execution out of the Express process; the existing draft uses a separate subprocess.
