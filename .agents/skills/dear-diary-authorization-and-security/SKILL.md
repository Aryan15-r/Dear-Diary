---
name: dear-diary-authorization-and-security
description: >-
  Resource-level authorization models, IDOR/BOLA prevention, session security, threat mitigation, CSRF/CORS policies, and signed media URLs for Dear Diary.
  Use when implementing or auditing access control, authentication handlers, media retrieval, or security features.
---

# Dear Diary — Authorization & Security System

This skill specifies the server-side authorization engine, role-based resource access control, IDOR/BOLA protection, media security, session management, and security threat mitigations.

---

## 1. Authorization Roles & Matrix

Authentication answers *"Who are you?"*; Authorization answers *"Are you allowed to perform this action on this resource?"*. Being logged in is never sufficient to read an entry.

### Role Definitions

| Role | Description | Default Permissions |
| :--- | :--- | :--- |
| **Owner** | User account that created the entry. | `Read`, `Create`, `Edit`, `Delete`, `Manage Access / Revoke` |
| **Recipient** | Explicitly authorized user via an active `access_grant`. | `Read` (View-only by default). **NO** Edit, Delete, Re-share, or Ownership. |
| **Unauthenticated / Other** | Any user without an active, non-expired `access_grant`. | `DENY` (HTTP 403 or 404). |

### Resource Hierarchy
Every sub-resource (`audio_entries`, `transcripts`, `attachments`) inherits access permissions from its parent `journal_entries`.

---

## 2. Server-Side Authorization Algorithm

For every request targeting a resource ID (`:id`):

```text
1. Extract & authenticate requester ID from session token.
2. Load target resource (e.g. entry) from DB by ID.
3. If resource does not exist -> Return HTTP 404 (or 403 to prevent enumeration).
4. If requester.id == resource.owner_user_id:
     -> ALLOW owner requested action.
5. Else:
     -> Query access_grants WHERE resource_id = target_id
                                AND recipient_user_id = requester.id
                                AND revoked_at IS NULL
                                AND (expires_at IS NULL OR expires_at > NOW())
6. If active grant exists AND requested action is in grant.permission:
     -> ALLOW action (Read-only by default).
7. Else:
     -> DENY access (HTTP 403 / 404).
```

---

## 3. Preventing IDOR / BOLA Vulnerabilities

- **Never Trust Path Identifiers Alone**: Direct resource URLs such as `/entries/:id`, `/audio/:id`, `/attachments/:id` MUST enforce the authorization algorithm above on every single invocation.
- **No Insecure Indirect References**: Modifying `:id` to probe another user's entry must consistently trigger an access denial.
- **Child Resource Authorization**: An audio file ID (`/audio/:audioId`) must perform a lookup joining `audio_entries` -> `journal_entries` to verify the requester's access to the entry before serving or generating a URL.

---

## 4. Controlled Sharing & Revocation Model

1. **Explicit Grants**: Sharing creates a discrete record in `access_grants` (`owner_user_id`, `recipient_user_id`, `resource_type`, `resource_id`, `permission`, `created_at`, `expires_at`, `revoked_at`).
2. **Immediate Revocation**: Setting `revoked_at = NOW()` immediately revokes access. All subsequent API queries from the recipient MUST return `DENY`.
3. **No Re-sharing**: Recipients cannot grant access to third parties.
4. **Invitation Tokens**:
   - Must be cryptographically unpredictable (e.g., CSPRNG 256-bit random tokens).
   - Stored hashed in DB (`token_hash`).
   - Expire after a set duration (e.g., 24-48 hours).
   - Single-use only.
   - Do not contain diary content or act as permanent passwords.

---

## 5. Security & Threat Mitigation Rules

### Authentication & Passwords
- **Password Hashing**: Use modern algorithms (`Argon2id` or `bcrypt` with appropriate cost factor). Never store plaintext passwords.
- **Session Security**: Store session tokens in `Secure`, `HttpOnly`, `SameSite=Lax` or `Strict` cookies. Store session hashes (`token_hash`) in the database.
- **Brute-Force Protection**: Enforce IP and account rate-limiting on `/auth/login`, `/auth/register`, `/auth/password-reset`, and `/access/invitations`.

### Input Sanitization & Web Security
- **Parameterized Queries**: Prevent SQL injection by using ORM bindings or parameterized SQL statements for 100% of queries.
- **XSS & Output Encoding**: Sanitize rich text inputs. Render user content securely in the frontend.
- **CORS Allowlist**: Explicit origin allowlist matching strict production domains. Never use wildcard `Access-Control-Allow-Origin: *` with credentials.
- **CSRF Protection**: Mandate CSRF token verification for cookie-authenticated state-changing requests (`POST`, `PATCH`, `PUT`, `DELETE`).

### Private Storage & Signed URLs
- Object storage buckets must be strictly **PRIVATE**.
- Media files are accessed using short-lived signed URLs (TTL ≤ 5–15 minutes) or proxied authenticated streams.
