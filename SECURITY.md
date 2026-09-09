# Security Requirements

## Security priority

Security is a system property, not a frontend feature.

## Threat model

Consider:

- Unauthorized authenticated users
- Unauthenticated attackers
- IDOR/BOLA
- Stolen sessions
- Credential stuffing
- Brute force
- XSS
- SQL injection
- CSRF
- Malicious uploads
- Storage misconfiguration
- Cache leakage
- CORS mistakes
- Sensitive logs
- Accidental public indexing
- Third-party service exposure

## Authentication

- Hash passwords with a modern password-hashing algorithm.
- Never store plaintext passwords.
- Use secure sessions.
- Use Secure and HttpOnly cookies where appropriate.
- Configure SameSite appropriately.
- Rate-limit authentication.
- Support password reset with expiring, single-use tokens.
- Consider MFA as an optional enhancement.

## Authorization

Every protected endpoint must verify:

1. The requester is authenticated.
2. The requester owns the resource OR has an active grant.
3. The requested action is permitted.

Never trust frontend state.

## IDOR/BOLA

Resource IDs are not authorization.

Tests must attempt:

```text
Account A → Account B entry
Account A → Account B audio
Account A → Account B attachment
Account A → Account B transcript
```

All must be denied unless explicitly authorized.

## Input security

Use:

- Parameterized queries
- Schema validation
- Safe output encoding
- Rich-text sanitization where needed
- Safe file handling

## File security

- Validate size and type.
- Inspect file signatures where practical.
- Generate server-side object names.
- Keep storage private.
- Never trust the client-provided MIME type alone.
- Never expose directory listings.

## Browser security

Use appropriate:

- Content-Security-Policy
- Strict-Transport-Security
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy
- Frame-ancestors

## CSRF/CORS

Cookie-authenticated state changes require CSRF protection appropriate to the architecture.

CORS must use an explicit allowlist. Never use wildcard credentialed CORS.

## Secrets

Never commit:

- API keys
- Database passwords
- Session secrets
- OAuth secrets
- Storage credentials
- Encryption keys

## Logging

Never log:

- Passwords
- Session cookies
- Access tokens
- Diary bodies
- Full transcripts
- Audio contents

## Security review

Before release, test authentication, authorization, IDOR, uploads, sessions, CORS, CSRF, XSS, rate limiting, storage, caching, and deletion.
