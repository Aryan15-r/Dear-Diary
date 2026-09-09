---
name: dear-diary-deployment-and-devops
description: >-
  Multi-environment setup, environment variable security, production headers, storage bucket policies, CDN caching, and database rollback procedures for Dear Diary.
  Use when configuring environments, CI/CD pipelines, headers, storage buckets, or deployment tasks.
---

# Dear Diary — Deployment & DevOps Engineering Guide

This skill defines environment configuration standards, infrastructure security policies, HTTP security headers, object storage security, CDN invalidation rules, and release rollback procedures for **Dear Diary**.

---

## 1. Environment Isolation

Deployments must isolate runtime environments with separate credentials, databases, and buckets:
- **`development`**: Local development environment (`.env.local`). Uses local DB and mock/local object storage.
- **`staging`**: Staging environment mirroring production configuration with staging database and isolated staging bucket.
- **`production`**: Production environment (`.env.production`). Strictly managed secrets, production DB with connection pooling, and private encrypted object storage.

---

## 2. Environment Variables & Secret Protection

- **`.env.example` Specification**: Maintain `.env.example` in version control with all key names documented and default dummy values.
- **PROHIBITED**: NEVER commit real database passwords, API keys, JWT secrets, OAuth secrets, or storage credentials into git.
- **Production Injection**: Inject production environment variables via secure secret managers (e.g. AWS Secrets Manager, GCP Secret Manager, Vault, or platform environment variables).

---

## 3. Mandatory Production Security Headers

The production backend/reverse-proxy (Nginx / Cloudflare / Caddy) MUST inject the following security headers:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(self), geolocation=()
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; frame-ancestors 'none';
```

---

## 4. Object Storage & CDN Caching Rules

- **Private Storage Bucket Rules**:
  - Disable all public read policies (`Block Public Access` = ON).
  - Enforce server-side encryption (SSE-S3 / SSE-KMS).
  - Serve media files exclusively through short-lived signed URLs (TTL ≤ 15 minutes) or authenticated backend streaming.
- **Cache Control Policies**:
  - Authenticated API routes (`/entries`, `/audio`, `/access`) MUST return:
    `Cache-Control: private, no-store, no-cache, must-revalidate, max-age=0`
  - Static frontend assets (JS/CSS bundles with content hashes) MAY use:
    `Cache-Control: public, max-age=31536000, immutable`

---

## 5. Rollback & Migration Safety Strategy

- **Backward-Compatible Database Migrations**: Apply database migrations using expand-contract patterns. Never run destructive column drops in the same release as code updates.
- **Database Backup & Recovery**: Perform database snapshot backups prior to executing production migrations. Test database restoration procedures regularly.
- **Application Rollback**: Maintain previous immutable container build artifacts to permit single-click rollback if deployment health checks or authorization smoke tests fail.
