---
name: dear-diary-api-and-backend
description: >-
  REST API endpoints, response minimization rules, status code conventions, rate limiting, and transcription service integration for Dear Diary.
  Use when creating or updating API controllers, routes, backend services, or external service integrations.
---

# Dear Diary — API & Backend Engineering Specifications

This skill defines the API route contracts, request processing pipeline, status code standards, payload security minimization rules, and external integrations for **Dear Diary**.

---

## 1. REST Endpoint Specifications

### Authentication Routes
- `POST /auth/register` — Register a new independent user account.
- `POST /auth/login` — Authenticate credentials and return secure HTTP-only session cookie.
- `POST /auth/logout` — Revoke active session token.
- `POST /auth/password-reset/request` — Generate single-use password reset link token.
- `POST /auth/password-reset/confirm` — Reset password using token.
- `GET /auth/session` — Get authenticated user details (`id`, `email`, `display_name`).

### Journal Entry Routes
- `GET /entries` — Paginated list of entries owned by or shared with authenticated user (`page`, `limit`, `filter`).
- `POST /entries` — Create new diary entry (`title`, `body`, `entry_date`, `mood`, `tags`, `access_level`). Defaults to `private`.
- `GET /entries/:id` — Get single entry details (verifies authorization).
- `PATCH /entries/:id` — Update entry text/metadata (Owner only).
- `DELETE /entries/:id` — Soft-delete entry (Owner only).

### Audio & Media Routes
- `POST /entries/:id/audio` — Upload audio recording to private storage for entry `:id` (Owner only).
- `GET /audio/:id` — Retrieve short-lived signed URL or stream for audio recording (Owner or Authorized Recipient).
- `DELETE /audio/:id` — Delete audio file (Owner only).

### Transcript Routes
- `POST /audio/:id/transcription` — Trigger audio transcription.
- `GET /audio/:id/transcript` — Get transcript text (Same permissions as parent audio).
- `PATCH /audio/:id/transcript` — Edit transcript text (Owner only).

### Access & Grant Management Routes
- `POST /access/invitations` — Generate invitation token/link to share with recipient.
- `POST /access/invitations/:id/accept` — Accept invitation to form access relationship.
- `POST /entries/:id/access` — Grant recipient access to specific entry `:id`.
- `DELETE /entries/:id/access/:grantId` — Revoke recipient access to entry `:id` immediately.
- `GET /entries/:id/access` — List active access grants for entry `:id` (Owner only).

---

## 2. Response Minimization & Data Exposure Rules

To preserve privacy and security, API responses MUST adhere to response minimization:
- **NEVER return**: Password hashes, session token secrets, raw storage credentials/keys, unneeded internal metadata, or other users' unrelated entries.
- **Generic Auth Errors**: Authentication failures (`/auth/login`) should return generic error messages (e.g. `"Invalid email or password"`) to prevent account enumeration attacks.
- **Resource Existence Obfuscation**: Requests to unauthorized entries SHOULD return `404 Not Found` or generic `403 Forbidden` without exposing whether the entry ID exists.

---

## 3. Standard HTTP Status Codes

| Code | Status | Usage |
| :--- | :--- | :--- |
| `200` | OK | Successful fetch, update, or login. |
| `201` | Created | Successful creation of entry, grant, or session. |
| `204` | No Content | Successful deletion or revocation with no body. |
| `400` | Bad Request | Schema validation failure, malformed JSON, invalid date format. |
| `401` | Unauthorized | Unauthenticated user, expired or missing session cookie/token. |
| `403` | Forbidden | Authenticated user lacks permission to access target resource. |
| `404` | Not Found | Resource does not exist or requester is unauthorized to know it exists. |
| `429` | Too Many Requests | Rate limit exceeded (login attempts, upload threshold, transcription requests). |
| `500` | Internal Error | Unhandled server exception. Sanitized output returned to client. |

---

## 4. Pagination & Rate Limiting

- **Mandatory Pagination**: `GET /entries` MUST require `limit` (max 50) and `page`/`cursor` parameter. Never return an entire diary collection in one query.
- **Rate-Limiting Policy**:
  - `/auth/login`: Max 5 attempts per IP per 15 minutes.
  - `/auth/password-reset/*`: Max 3 attempts per hour.
  - `/entries/:id/audio` (uploads): Max 10 uploads per hour.
  - `/audio/:id/transcription`: Max 5 requests per hour.

---

## 5. Third-Party Transcription Processing Rules

- **Server-Side API Keys**: Third-party speech-to-text API keys (e.g. OpenAI Whisper, Google Speech-to-Text) MUST remain strictly server-side.
- **User Informed**: Provide explicit UI setting informing users that audio is sent for automated transcription.
- **Permission Inheritance**: Transcripts inherit the exact permissions of the parent audio entry. Private audio -> Private transcript.
