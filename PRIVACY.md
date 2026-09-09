# Privacy Requirements

## Privacy philosophy

Collect the minimum data required to operate the application.

Private diary content is sensitive application data and must be treated accordingly.

## Data categories

Potential data includes:

- Account identifiers
- Authentication/session data
- Journal text
- Audio
- Transcripts
- Attachments
- Tags and moods
- Sharing permissions
- Security/audit metadata

## Data minimization

Do not collect:

- Precise location unless genuinely required
- Unnecessary device fingerprints
- Advertising identifiers
- Unnecessary analytics
- Unrelated profile information

## Sensitive content rules

Never put diary content into:

- Analytics events
- URLs
- Query parameters
- Push notification text
- Email previews
- Error reports
- Debug logs
- Public metadata
- Open Graph previews

## Third-party processors

If audio or text is sent to a third-party transcription/AI service:

- Tell the user what is sent.
- Send only what is required.
- Keep credentials server-side.
- Understand provider retention.
- Do not silently send private content to unrelated services.

## Sharing

Sharing must be:

- Explicit
- Granular
- Revocable
- Server-enforced

## Deletion

Deleting a resource should remove normal user access immediately and handle associated media and permission records correctly.

Backup retention must be documented.

## Privacy UI

Use neutral, truthful labels.

Prefer:

- `Private`
- `Access granted`
- `Updates`
- `Journal`

Avoid unnecessary relationship-specific wording.

Discretion in UI is not a substitute for security.

## Notifications

Use generic notification text.

Never include diary excerpts or transcript content.

## Caching

Private responses must not be publicly cached.

Review browser, CDN, service-worker, and proxy caching.

## Analytics

If analytics are enabled:

- Exclude diary content.
- Exclude transcript text.
- Avoid sensitive event properties.
- Prefer privacy-preserving analytics.
