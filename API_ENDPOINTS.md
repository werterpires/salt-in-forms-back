# API Endpoints Overview

Summary
- Total endpoints: 75
- GET: 27, POST: 25, PUT: 14, PATCH: 3, DELETE: 6

This document lists all HTTP endpoints exposed by the backend and proposes an end‑to‑end test sequence for the frontend QA team.

Notes:
- No global prefix is set; all paths below are relative to the server root (e.g., `/candidates/self-register`).
- "Public" means no authentication required. Other endpoints require a valid JWT and appropriate role (`ADMIN`, `SEC`, `INTERV`).

## Authentication
- POST /auth/login — Public, guarded by LocalAuth
- POST /auth/verify-2fa — Public
- POST /auth/resend-2fa — Public
- POST /auth/policies — Public, guarded by LocalAuth
- POST /auth/logon/:invitationCode — Public
- GET  /auth/logon/:invitationCode — Public
- POST /auth/forgot-password — Public, throttled
- POST /auth/reset-password — Public, throttled

Defined in: src/shared/auth/auth.controller.ts

## Candidates
Public self-service + admin/role endpoints.
- POST /candidates/self-register — Public
- GET  /candidates/confirm-registration/:token — Public
- POST /candidates/complete-registration/:token — Public
- POST /candidates/resend-confirmation — Public
- GET  /candidates/registration-status/:orderCode — ADMIN, SEC
- GET  /candidates/process/:processId — ADMIN, SEC (query: `direction`, `page`, `column`)
- GET  /candidates/:uniqueCode — Public (validate access code)
- POST /candidates/sign-terms/:uniqueCode — Public
- POST /candidates/distribute-interviewers/:processId — ADMIN
- POST /candidates/assign-interviewer — ADMIN (body includes `userId`, `candidateId`)
- GET  /candidates/interviewer/:processId — INTERV
- PUT  /candidates/update-approval — ADMIN
- GET  /candidates/editable-forms/:candidateId — ADMIN, SEC
- PUT  /candidates/update-form-email — ADMIN, SEC

Defined in: src/candidates/candidates.controller.ts

## Answers
- POST /answers — Public (submit an answer)

Defined in: src/answers/answers.controller.ts

## Forms Candidates
- PUT /forms-candidates/submit — Auth (200 OK; submits by `accessCode` in body)

Defined in: src/forms-candidates/forms-candidates.controller.ts

## Questions
- POST   /questions — Auth
- GET    /questions/section/:formSectionId — Auth
- GET    /questions/quantity/:sectionId — Auth
- PUT    /questions — Auth
- DELETE /questions/:questionId — Auth
- PATCH  /questions/reorder — Auth

Defined in: src/questions/questions.controller.ts

## Questions Areas
- POST   /questions-areas — ADMIN
- GET    /questions-areas — ADMIN (filters: `page`, `direction`, `column`, `questionAreaName`, `questionAreaActive`)
- PUT    /questions-areas — ADMIN
- DELETE /questions-areas/:questionAreaId — ADMIN

Defined in: src/questions-areas/questions-areas.controller.ts

## Form Sections
- POST   /form-sections — ADMIN
- GET    /form-sections/by-form/:sFormId — ADMIN
- PUT    /form-sections — ADMIN
- DELETE /form-sections/:formSectionId — ADMIN (204 No Content)
- PUT    /form-sections/reorder — ADMIN

Defined in: src/form-sections/form-sections.controller.ts

## Fields
- GET /fields/unions — Public

Defined in: src/fields/fields.controller.ts

## Rates (Interview Flow)
- GET   /rates/interview/:candidateId — INTERV
- GET   /rates/interview-admin/:candidateId — ADMIN, SEC
- GET   /rates/candidate/:candidateId — INTERV
- POST  /rates — INTERV
- PATCH /rates — INTERV
- PATCH /rates/answer/:answerId/comment — INTERV

Defined in: src/rates/rates.controller.ts

## Processes
- POST   /processes — ADMIN
- GET    /processes — ADMIN, SEC (filters: `direction`, `page`, `column`, `status`, `title`)
- PUT    /processes — ADMIN
- GET    /processes/public/active — Public
- GET    /processes/all — ADMIN, SEC
- DELETE /processes/:id — ADMIN

Defined in: src/processes/processes.controller.ts

## Ministerials
- POST /ministerials — Auth
- GET  /ministerials — Auth (filters: `page`, `direction`, `column`, `ministerialName`, `fieldId`, `unionId`)
- PUT  /ministerials — Auth

Defined in: src/ministerials/ministerials.controller.ts

## Terms
- POST   /terms — ADMIN
- GET    /terms — ADMIN (filters: `direction`, `page`, `column`, `roleId`, `termTypeId`, `onlyActive`)
- PUT    /terms — ADMIN
- DELETE /terms/:id — ADMIN

Defined in: src/terms/terms.controller.ts

## S-Forms
- POST   /s-forms — ADMIN
- GET    /s-forms/:processId — ADMIN (pagination: `direction`, `page`, `column`)
- GET    /s-forms/form/:sFormId — ADMIN
- PUT    /s-forms — ADMIN
- DELETE /s-forms/:sFormId — ADMIN
- GET    /s-forms/simple/:processId — ADMIN
- GET    /s-forms/basic/:processId — ADMIN
- POST   /s-forms/copy — ADMIN

Defined in: src/s-forms/s-forms.controller.ts

## Users
- POST /users — ADMIN
- POST /users/reinvite — ADMIN
- GET  /users/own — Auth
- GET  /users — ADMIN (filters: `direction`, `page`, `column`, `roleId`, `userEmail`, `userActive`)
- PUT  /users/own — Auth
- PUT  /users/password — Auth
- PUT  /users — ADMIN
- GET  /users/interviewers/active — ADMIN

Defined in: src/users/users.controller.ts

---

# QA Test Sequence (Suggested)
This sequence validates the main public registration flow, answer submission, and role-restricted operations.

1) Public Discovery
- GET /processes/public/active — List active processes.
- GET /fields/unions — Load unions for forms.

2) Candidate Self-Registration
- POST /candidates/self-register — Start signup with `orderCode`.
- POST /candidates/resend-confirmation — Optional: resend confirmation email.
- GET  /candidates/confirm-registration/:token — Confirm email.
- POST /candidates/complete-registration/:token — Complete registration with additional data.

3) Access Code + Terms
- GET  /candidates/:uniqueCode — Validate access code.
- POST /candidates/sign-terms/:uniqueCode — Sign required terms.

4) Answering Forms
- GET  /s-forms/:processId — Admin retrieves forms for the process.
- GET  /form-sections/by-form/:sFormId — Admin fetches sections.
- GET  /questions/section/:formSectionId — Admin/QAs load questions.
- POST /answers — Candidate submits an answer.
- PUT  /forms-candidates/submit — Candidate submits form (`accessCode`).

5) Interviewer Flow
- GET  /candidates/interviewer/:processId — INTERV sees assigned candidates.
- GET  /rates/interview/:candidateId — INTERV loads interview data.
- POST /rates — INTERV creates a rate.
- PATCH /rates — INTERV updates a rate.
- PATCH /rates/answer/:answerId/comment — INTERV updates answer comment.

6) Admin Operations
- POST /candidates/distribute-interviewers/:processId — Distribute candidates.
- POST /candidates/assign-interviewer — Assign a specific interviewer.
- PUT  /candidates/update-approval — Update approval status.
- GET  /candidates/editable-forms/:candidateId — Review editable form emails.
- PUT  /candidates/update-form-email — Update destination email.

7) Management (as needed)
- Users: CRUD-like via /users (admin-only ops).
- Processes: lifecycle via /processes (admin/SEC).
- S-Forms, Form Sections, Questions, Questions Areas, Terms, Ministerials: Admin maintenance per sections above.

Authentication touchpoints for QA:
- Login + 2FA: /auth/login → /auth/verify-2fa → /auth/policies
- Password recovery: /auth/forgot-password → /auth/reset-password
- Logon flow: /auth/logon/:invitationCode (GET + POST)

---

# Tips for QA
- Role simulation: test with JWTs for `ADMIN`, `SEC`, `INTERV`, and anonymous (Public).
- Pagination/filters: verify responses change with `page`, `direction`, `column`, and filter params where applicable.
- Edge cases: invalid tokens (registration), expired processes (rates creation), access code mismatches.
