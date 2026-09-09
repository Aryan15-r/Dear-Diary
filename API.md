# API Contract

This document describes the intended API behavior. Exact paths may change with the chosen framework.

## Authentication

```text
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/password-reset/request
POST /auth/password-reset/confirm
GET  /auth/session
```

Protected endpoints require authentication.

## Journal

```text
GET    /entries
POST   /entries
GET    /entries/:id
PATCH  /entries/:id
DELETE /entries/:id
```

Every operation must authorize the specific entry.

## Audio

```text
POST   /entries/:id/audio
GET    /audio/:id
DELETE /audio/:id
```

Audio retrieval requires authorization to the associated entry.

## Transcripts

```text
POST  /audio/:id/transcription
GET   /audio/:id/transcript
PATCH /audio/:id/transcript
```

Transcript access must follow audio/entry authorization.

## Attachments

```text
POST   /entries/:id/attachments
GET    /attachments/:id
DELETE /attachments/:id
```

## Access

Possible conceptual endpoints:

```text
POST   /access/invitations
POST   /access/invitations/:id/accept
POST   /entries/:id/access
DELETE /entries/:id/access/:grantId
GET    /entries/:id/access
```

Exact route names are implementation decisions.

## Rules

### Authentication

Unauthenticated requests to protected resources must not receive private data.

### Authorization

Every resource request must independently verify access.

### Errors

Use appropriate status codes:

```text
400/422 invalid input
401 unauthenticated
403 authenticated but unauthorized
404 resource unavailable/not exposed
429 rate limited
```

Avoid detailed errors that reveal private resource existence where inappropriate.

## Response minimization

Return only the fields the client needs.

Do not return:

- Password hashes
- Session secrets
- Internal storage credentials
- Unnecessary private metadata
- Other users' unrelated information

## Pagination

Use pagination for entry lists and activity histories.

Do not return an entire diary in one request.

## Rate limiting

Apply rate limits to authentication, invitations, uploads, transcription, and expensive operations.
