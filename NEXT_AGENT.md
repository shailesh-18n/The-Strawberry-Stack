# Next Agent

## Current phase

Phase 1 — Project Foundation is complete and verified. Do not start the next
phase until the user explicitly approves it.

## Next phase after approval

Phase 2 — Student Interface and Onboarding. Read the user-supplied phase
requirements, implement only that phase, and update the status, development
log, API/schema docs, and this handoff. Do not wire career, assessment,
assistant, progress, credential, or recruiter drafts unless Phase 2 explicitly
requires them.

## Retained constraints

- Keep the approved Node.js, Express, EJS, Bootstrap 5, MongoDB, and Mongoose
  stack; do not replace it with React, TypeScript, or Next.js.
- Keep external AI integrations server-side and secure; do not claim an
  integration works unless it has been implemented and tested.
- Never execute untrusted assessment code in the Express process; use an
  appropriately isolated execution environment.
- Existing feature routes and in-memory services are drafts, not verified or
  enabled workflows.
- The workspace has no Git metadata. Do not infer repository status or claim
  `.env` is untracked based only on its `.gitignore` entry.
