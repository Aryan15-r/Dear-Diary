# Deployment Guide

## Environments

Prefer:

```text
development
staging
production
```

Keep credentials and configuration isolated.

## Production requirements

- HTTPS
- Secure authentication cookies
- Production secrets stored securely
- Private object storage
- Database access restricted
- Rate limiting
- Security headers
- Error monitoring without sensitive payloads
- Backups
- Restore testing

## Environment variables

Document required variables in `.env.example`.

Never commit production values.

## Database

Before production:

- Apply migrations.
- Verify indexes.
- Verify least-privilege credentials.
- Back up appropriately.
- Test restore.

## Storage

Verify:

- Bucket/container is private.
- Public listing is disabled.
- Unauthorized reads fail.
- Temporary URLs expire as intended.
- Deletion behavior is correct.

## Caching/CDN

Ensure authenticated/private responses are not publicly cached.

Review:

- CDN rules
- Browser cache headers
- Service worker behavior

## Domain

Use HTTPS for the production domain.

Do not expose staging/admin/debug endpoints publicly without proper protection.

## Deployment checklist

```text
[ ] Build succeeds
[ ] Tests pass
[ ] Authorization tests pass
[ ] No secrets in repository
[ ] HTTPS enabled
[ ] Security headers configured
[ ] Private storage verified
[ ] Database permissions verified
[ ] Rate limiting enabled
[ ] Error logging reviewed
[ ] Backup verified
[ ] Restore procedure tested
[ ] Production configuration reviewed
```

## Rollback

Have a documented rollback strategy for:

- Application releases
- Database migrations
- Storage changes

Never perform destructive migrations without a recovery plan.
