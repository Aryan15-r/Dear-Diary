# Contributing

## General rule

Changes must preserve the requirements defined by the project documentation.

## Before a change

Read the relevant documentation.

Security-sensitive changes require particular attention to:

- `SECURITY.md`
- `PRIVACY.md`
- `AUTHORIZATION.md`
- `DATABASE.md`

## Pull requests

A change should describe:

- What changed
- Why it changed
- Files affected
- Tests added/updated
- Security/privacy implications
- Any migration requirements

## Authorization changes

Any change that affects access to:

- Entries
- Audio
- Transcripts
- Attachments
- Sharing

must include authorization tests.

## Database changes

Include:

- Migration
- Index considerations
- Backward compatibility
- Rollback/recovery plan where appropriate

## UI changes

Verify:

- Mobile
- Tablet
- Desktop
- Light mode
- Dark mode
- Accessibility

## AI-generated code

AI-generated code is treated like human-written code.

Review it before merging.

Never include secrets or private diary content in AI prompts.

## Prohibited changes

Do not introduce:

- Hidden backdoors
- Universal passwords
- Authorization bypasses
- Public private storage
- Secret URLs as authentication
- Logging of diary content
