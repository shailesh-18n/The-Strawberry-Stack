# Database Schema

## Phase 1 persistence state

Mongoose is configured as the MongoDB access layer. No Mongoose models, collections, seed records, or migration assumptions are implemented in Phase 1. The database name comes from `MONGODB_URI` (the example URI uses `vidyachain`).

Development startup without `MONGODB_URI` is allowed with an explicit warning; readiness reports the database as disconnected. If a URI is configured, connection failures are surfaced and prevent startup. Production startup requires the URI. Copy `.env.example` to `.env` for local configuration; `.env` is excluded from Git.

## Existing conceptual entities (not persisted)

The earlier project notes describe the following intended product data. These are conceptual shapes only: the current `utils/store.js` keeps demo records in memory, and none of these are Mongoose schemas.

- **User:** name, email, password hash, preferred language, interests, aspirations, skills, education, learning preferences, access needs, profile summary, creation time.
- **Career:** name, slug, description, skills, prerequisites, level, roadmap.
- **Assessment record:** user, challenge, skill, result, score, raw output, pass state, creation time.
- **Progress record:** user, skill, commit-style message, previous/current level, change summary, creation time.
- **Credential:** user, student name, skill, assessment, evidence hash, issuer, signature, status, creation time.

These concepts support the planned journey described in
[ARCHITECTURE.md](ARCHITECTURE.md), but do not constitute implemented database
models. Confirm fields, validation, indexes, relationships, and retention
requirements against the approved phase requirements before adding schemas.
