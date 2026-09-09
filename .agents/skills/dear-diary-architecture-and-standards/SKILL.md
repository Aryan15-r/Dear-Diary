---
name: dear-diary-architecture-and-standards
description: >-
  Architectural design, system boundaries, core principles, development workflow, and coding standards for the Dear Diary application.
  Use whenever planning, structuring, or refactoring components in the Dear Diary project.
---

# Dear Diary — Architecture & Engineering Standards

This skill defines the primary system architecture, core engineering principles, layered boundaries, and coding standards for **Dear Diary**.

---

## 1. Core Engineering Principles

1. **Independent Accounts**: Every user has a separate, independent user account. Never support a single shared account or password sharing.
2. **Private by Default**: Every journal entry, audio file, transcript, and attachment is strictly private to the owner by default.
3. **Discreet & Neutral Terminology**: Use ordinary, neutral product terminology ("Journal", "Entries", "Updates", "Access Granted"). Never use romantic, relationship-specific, or secret-room labels ("boyfriend", "couple", "secret room").
4. **Server-Enforced Authorization**: All access checks are enforced on the backend server. Frontend checks are for UX only and are never an authorization boundary.
5. **No Security-Through-Obscurity**: Never rely on unlisted paths, hidden URLs, secret tokens in links, CSS hiding, or obscure parameters for security.
6. **Deny-by-Default Failure Principle**: If authorization cannot be confidently verified, deny access (HTTP 403 / 404). Never fail open.
7. **Resource-Level Authorization**: Check the authenticated identity against database permission records for every requested resource (`journal_entries`, `audio_entries`, `transcripts`, `attachments`).
8. **Inherited Media Permissions**: Audio recordings, transcripts, and attachments inherit exact access rules from their parent journal entry.
9. **Zero Leakage**: Private diary content, transcripts, credentials, and sensitive metadata must never appear in URLs, logs, analytics, error reports, open-graph tags, or push notifications.
10. **Truthful & Verified Implementation**: Do not claim a feature is secure or implemented unless verified with automated tests.

---

## 2. Layered Architecture & Request Flow

```text
Client (Untrusted: Browser / Mobile Web / Tablet)
  ↓ [HTTPS / Secure Cookies]
Authentication & Session Validation (Backend)
  ↓ [Authenticated User Identity]
API / Business Logic Layer (Backend Handler)
  ↓ [Input Validation & Sanitization]
Authorization Engine (Backend Resource Check)
  ↓ [Database Query with Permission Verification]
Database & Private Storage (PostgreSQL / MySQL / S3 Signed URLs)
```

### Logical Components

- **Frontend**: Mobile-first web application (React/Vite or equivalent responsive framework). Handles UI rendering, user interaction, client-side UX validation, and audio recording. Untrusted boundary.
- **Backend**: API server. Handles authentication, session management, input validation, authorization, business logic, signed storage URL generation, rate limiting, and audit logging.
- **Database**: Relational database storing users, sessions, entries, access grants, invitations, attachments metadata, and audit logs.
- **Private Object Storage**: Encrypted bucket for audio recordings and media attachments. Public access disabled. Served only via short-lived signed URLs or authenticated proxy streams.

---

## 3. Development Guidelines & Directives

### Protected Handler Template
Every backend API handler protecting sensitive resources must strictly follow this 5-step lifecycle:
```text
1. Authenticate (Verify session token -> resolve requester identity)
2. Validate Input (Schema check, sanitize strings, reject invalid payloads)
3. Authorize Resource (Query owner_user_id or active access_grant -> verify action)
4. Execute Operation (Perform DB mutation / retrieval / signed URL creation)
5. Return Minimum Data (Strip password hashes, internal secrets, and unneeded fields)
```

### Prohibited Code Practices
- **DO NOT** create hidden admin backdoors or universal bypass master keys.
- **DO NOT** hardcode secrets, API keys, or database credentials.
- **DO NOT** trust user IDs passed in query parameters or request bodies.
- **DO NOT** log diary content, audio data, or transcript text under any log level.
- **DO NOT** disable CORS, CSRF, or authentication flags for local testing or demos.
