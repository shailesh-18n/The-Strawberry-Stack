# Database Schema

## MongoDB collections

Mongoose stores student accounts and learning profiles in the `users`
collection. The configured URI selects the database. Express sessions use the
`sessions` collection. `Career` and `Skill` reference data is idempotently
seeded on application startup when MongoDB is available. Startup fails visibly
if catalogue seeding fails.

### User

- `name`: required, trimmed string, 2–80 characters
- `email`: required, trimmed/lowercased unique string
- `passwordHash`: required bcrypt hash; excluded from normal query selection;
  registration accepts passwords of at least 10 characters and at most 72
  UTF-8 bytes to match bcrypt's effective input limit
- `preferredLanguage`: `Bengali` or `English`
- `interests`: up to 10 learner-provided strings, max 80 characters each
- `aspirations`: up to 10 selected career names, max 80 characters each
- `skillInventory`: up to 10 strings, max 80 characters each
- `assessedSkills`: references to skills verified by a passed assessment
- `educationLevel`: optional string, max 80 characters
- `learningPreferences`: up to 10 strings, max 80 characters each
- `accessNeeds`: up to 10 strings, max 80 characters each
- `profileSummary`: optional string, max 1,000 characters
- `createdAt` / `updatedAt`: Mongoose timestamps

Profile updates do not change email or password. Password reset and email
changes are outside Phase 2.

### Career

- `slug`: unique lowercase career key
- `name`, `description`, `level`: validated career metadata
- `interestTags`: normalized structured tags used for deterministic matching
- `requiredSkills`: ordered mappings to `Skill` ObjectIds

### Skill

- `slug`: unique lowercase skill key
- `name`, `description`, `category`, `level`
- `aliases`: normalized profile-skill match terms
- `prerequisites`: `Skill` ObjectId references forming the dependency graph
- `learningActivity`: suggested practice activity used by generated roadmaps
  and career recommendations

### StudentAssessment

- `student`: `User` ObjectId
- `challengeId`: identifier of the configured guided or coding assessment
- `skill`: `Skill` ObjectId assessed by the challenge
- `submissionType`: `quiz` or `code`
- `submissionKey`: per-student idempotency key for code submissions; unique
  partial index with student
- `passed`, `passedTests`, `totalTests`, `score`, `verdict`
- `providerSubmissionId`: remote provider identifier when available
- `sourceHash`: SHA-256 of submitted source; raw source is not stored
- `compileError`: bounded safe diagnostic
- `testResults`: capped verdicts; hidden outputs and errors are stripped
- timestamps

### SkillTrackProgress

- `student`: `User` ObjectId
- `skill`: `Skill` ObjectId
- `assessment`: `StudentAssessment` ObjectId
- `score`, `passed`, and a short result summary
- timestamps
- unique compound index on `{ student, assessment }` for retry-safe recording

This is the minimal Phase 6 assessment-progress record, not a full learner
SkillTrack feature. Coding source and fixed test input are transmitted to
OnlineCompiler.io only after the student consents. Provider retention is
governed by its plan terms; VidyaChain does not claim independent verification
of the provider's sandbox or data handling.

### SkillTrackEntry

- `student`: `User` ObjectId; all reads are scoped to this owner
- `skill`: `Skill` ObjectId from the server-side skill catalogue
- `previousLevel`, `currentLevel`: learner-reported levels from
  `beginner`, `intermediate`, and `advanced`
- `commitMessage`: required 3-100 character milestone title
- `changeSummary`: required 3-500 character progress description
- timestamps
- compound indexes on `{ student, createdAt }` and `{ student, skill,
  createdAt }` support private recent-history and per-skill history queries

The route derives `previousLevel` from the student's latest entry for the
selected skill (or `beginner` for the first entry). These are self-reported
progress notes, not verified skills or credentials. The SkillTrack page also
reads `SkillTrackProgress` and `LearningProgress`; it does not duplicate those
source records.

### LearningProgress

- `student`: `User` ObjectId
- `skill`: `Skill` ObjectId from the packaged offline lesson set
- `completedAt`: server-assigned completion time
- timestamps
- unique compound index on `{ student, skill }` so offline sync can be retried
  safely without duplicate completion records

Only completion slugs from the currently packaged HTML, CSS, and JavaScript
lessons are accepted by the synchronization endpoint. Before sync, the
browser stores completed slugs, pending slugs, and the last server completion
snapshot in IndexedDB; names, email, questions, and session tokens are not
stored in the offline progress record. Sync is idempotent and merges
concurrent completion records without deleting progress.

Career recommendations use the student profile plus these structured records
at request time. The personalized recommendation and assistant conversation
are not persisted. Offline lesson completion is persisted only after an
authenticated student synchronizes it.

Development startup without `MONGODB_URI` is allowed for foundation/health
checks; readiness reports disconnected and student persistence operations
cannot succeed. A configured connection failure prevents startup. Production
startup requires the URI. Copy `.env.example` to `.env`; `.env` is excluded
from Git.

## Deferred conceptual entities

The following entities remain conceptual and are not implemented as Mongoose
models. The earlier `utils/store.js` feature drafts retain sample records in
memory only.

- **Credential:** user, student name, skill, assessment, evidence hash, issuer, signature, status, creation time.

Credential fields, validation, indexes, relationships, and retention
requirements remain to be confirmed against the approved later-phase scope.
