# Testing Strategy

## Test levels

Use:

- Unit tests
- Integration tests
- API tests
- Authorization tests
- End-to-end tests
- Security tests
- Responsive/manual UI tests

## Authentication tests

Test:

- Valid login
- Invalid password
- Expired session
- Revoked session
- Password reset expiry
- Rate limiting
- Logout

## Authorization tests

Test every resource type.

```text
Owner → allowed
Authorized recipient → allowed for granted actions
Unauthorized user → denied
Unauthenticated user → denied
Revoked recipient → denied
Expired recipient grant → denied
```

## IDOR tests

Attempt to replace:

- Entry ID
- Audio ID
- Transcript ID
- Attachment ID
- User ID

with another user's resource.

Expected result: denied.

## Sharing tests

Test:

- Create invitation
- Accept invitation
- Expired invitation
- Reused invitation
- Revoked invitation
- Grant access
- Revoke access
- Read after revocation

## Media tests

Verify:

- Anonymous media access is denied.
- Unauthorized media access is denied.
- Authorized access works.
- Expired signed URLs stop working where applicable.
- Deleted media is no longer user-accessible.

## Security tests

Test for:

- XSS
- SQL injection
- CSRF
- CORS mistakes
- Rate-limit bypass
- Session fixation
- Broken access control
- Path traversal
- Malicious file uploads
- Sensitive data exposure

## Privacy tests

Search logs and responses for accidental exposure of:

- Diary text
- Transcript text
- Tokens
- Passwords
- Storage credentials

Check:

- URLs
- Notifications
- Analytics
- Error tracking
- Browser cache
- CDN cache

## UI tests

Check common phone and tablet widths.

Verify:

- Touch targets
- Keyboard behavior
- Audio controls
- Forms
- Dark mode
- Accessibility
- Orientation changes

## Release gate

A release must not ship if a critical authorization or privacy test fails.
