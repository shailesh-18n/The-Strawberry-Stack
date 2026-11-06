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
- `role`: string enum `['student', 'recruiter']`, default `'student'`
- `company`: optional trimmed string for recruiters, max 120 characters
- `portfolioPrivacy`: string enum `['public', 'private']`, default `'public'`
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

### SkillTrackEntry (Git-inspired Learning History)

- `student`: `User` ObjectId; all reads are scoped to this owner
- `skill`: `Skill` ObjectId from the server-side skill catalogue
- `previousLevel`, `currentLevel`: skill levels (`beginner`, `intermediate`, `advanced`)
- `commitMessage`: required 3-100 character milestone or assessment achievement title
- `changeSummary`: required 3-500 character progress description
- `commitHash`: 8-character hex string representing the git commit hash
- `branch`: career or learning path branch (e.g. `main`, `python-developer`)
- `tag`: verified milestone tag (e.g. `v1.0-...`) or null
- `isVerified`: boolean indicating verified assessment status
- `entryType`: `'milestone'` | `'assessment'` | `'lesson'`
- `assessment`: optional `StudentAssessment` ObjectId reference
- `score`, `previousScore`, `scoreDelta`: numerical assessment scoring progress
- `diff`: progress comparison string (e.g. `+50% score improvement` or `Level advanced`)
- `status`: `'initial'` | `'improved'` | `'regressed'` | `'unchanged'`
- timestamps
- compound indexes on `{ student, createdAt }`, `{ student, skill, createdAt }`, `{ student, branch, createdAt }`, and `{ student, assessment }`

All historical achievements are append-only and preserved: previous records are never silently overwritten.

### Credential (Cryptographic Skill Passport)

- `student`: `User` ObjectId
- `studentName`: student name string
- `skill`: `Skill` ObjectId reference
- `skillName`: human-readable skill name
- `assessment`: `StudentAssessment` ObjectId reference
- `assessmentId`: challenge slug identifier
- `assessmentResult`: result verdict (default `'passed'`)
- `evidenceHash`: deterministic SHA-256 hash over `{ userId, studentName, skillName, assessmentId, assessmentResult, previousHash, issuedAt }`
- `previousHash`: cryptographic hash chain reference linking to the student's previous credential (`genesis` for the first)
- `issuer`: `'VidyaChain'`
- `signature`: Ed25519 asymmetric cryptographic digital signature
- `status`: `'verified'` | `'revoked'`
- `issuedAt`: ISO-8601 string timestamp
- `qrCode`: base64 image/png data URL for verification
- unique compound index on `{ student, assessment }` prevents duplicate credential issuance
- compound index on `{ student, createdAt }` for passport retrieval

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

### Opportunity (Internship & Job Listings)

- `title`: required string, max 120 characters (e.g. `'Junior Python Developer Intern'`)
- `company`: required string, max 120 characters (e.g. `'DataCraft Labs'`)
- `location`: required string, max 120 characters (e.g. `'Remote (India)'`)
- `type`: enum `['Internship', 'Full-time', 'Part-time', 'Apprenticeship']`, default `'Internship'`
- `stipend`: optional string, max 80 characters (e.g. `'₹15,000 - ₹25,000 / month'`)
- `description`: required string, max 2,000 characters
- `requiredSkills`: array of `Skill` ObjectId references required for the role
- `preferredSkills`: array of `Skill` ObjectId references preferred for the role
- `status`: enum `['active', 'closed']`, default `'active'`
- `createdAt` / `updatedAt`: Mongoose timestamps
- compound index on `{ status: 1, createdAt: -1 }` for active opportunity queries

Development startup without `MONGODB_URI` is allowed for foundation/health
checks; readiness reports disconnected and student persistence operations
cannot succeed. A configured connection failure prevents startup. Production
startup requires the URI. Copy `.env.example` to `.env`; `.env` is excluded
from Git.

## Future conceptual entities

All core MVP collections (Users, Careers, Skills, Assessments, Progress,
SkillTrack Entries, Credentials, Opportunities, and Sessions) are fully implemented
and verified. Future enterprise expansions may include:

- **Enterprise ATS Webhooks:** Bi-directional sync with platforms like Lever, Greenhouse, or Workday.
- **Direct Employer In-App Messaging:** Secure student-to-employer messaging channels.
