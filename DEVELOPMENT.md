# Development Guide

## Before coding

Read:

- `PRD.md`
- `ARCHITECTURE.md`
- `SECURITY.md`
- `PRIVACY.md`
- `AUTHORIZATION.md`
- `DATABASE.md`
- `API.md`
- `UI_UX.md`

## Coding principles

- Prefer simple, maintainable code.
- Use clear naming.
- Keep modules focused.
- Avoid unnecessary dependencies.
- Validate external input.
- Handle errors explicitly.
- Do not duplicate authorization logic carelessly.
- Keep security-sensitive code easy to audit.

## Frontend

The frontend is untrusted.

Never make authorization decisions solely in client code.

Client-side validation is for UX, not security.

## Backend

Every protected handler should follow:

```text
authenticate
→ validate input
→ authorize resource
→ execute operation
→ return minimum necessary data
```

## Database

- Use parameterized queries/ORM-safe APIs.
- Use transactions when required.
- Add indexes based on real query patterns.
- Avoid N+1 queries.
- Do not expose direct database access to clients.

## Storage

Keep private media in private storage.

Never construct public storage URLs for private resources.

## Environment variables

Use `.env.example`.

Never commit actual secrets.

## Dependencies

Keep dependencies updated.

Before adding a package, consider:

- Maintenance
- License
- Security history
- Bundle size
- Necessity

## AI-assisted development

When using an AI coding assistant:

1. Tell it to read the documentation first.
2. Give it one bounded task at a time.
3. Require it to explain changed files.
4. Require tests for security-sensitive changes.
5. Review generated code manually.
6. Never paste real secrets into prompts.
7. Never accept claims such as “secure” without verification.

## Do not

- Add hidden backdoors.
- Disable security to make a demo work.
- Hardcode secrets.
- Trust user IDs from the browser.
- Skip authorization because a route is obscure.
- Log private diary content.
- Mark unfinished features as complete.
