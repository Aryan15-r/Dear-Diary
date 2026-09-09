# Architecture

## 1. Architectural principles

Use a layered architecture with explicit boundaries between:

```text
Client
  ↓
Authentication/session
  ↓
API/application layer
  ↓
Authorization
  ↓
Database/storage
```

The client is untrusted.

## 2. Logical components

### Frontend

Responsible for:

- Rendering UI
- Local interaction state
- Form validation for UX
- Audio recording
- Calling authenticated APIs

The frontend must never be treated as an authorization boundary.

### Backend

Responsible for:

- Authentication
- Session validation
- Authorization
- Business rules
- Input validation
- Database access
- Storage access
- Signed media URLs or secure streaming
- Rate limiting

### Database

Stores:

- Users
- Sessions
- Entries
- Permissions
- Invitations
- Metadata
- Audit events

### Private object storage

Stores:

- Audio
- Images
- Attachments

Objects must not be publicly readable.

## 3. Request flow

```text
Browser
  ↓
HTTPS
  ↓
Application/API
  ↓
Authenticate request
  ↓
Authorize resource
  ↓
Query only permitted data
  ↓
Return minimum necessary data
```

## 4. Media flow

```text
Authenticated request
  ↓
Authorization check
  ↓
Short-lived signed URL or authenticated stream
  ↓
Private object storage
```

## 5. Sharing model

Sharing is represented by explicit permission records, not by special URLs.

```text
owner_user_id
recipient_user_id
resource_id
permission
created_at
expires_at
revoked_at
```

## 6. Deployment

Use separate development, staging, and production environments where practical.

Secrets must be supplied through environment-specific secret management.

## 7. Failure principle

If authorization cannot be confidently established, deny access.

Do not fail open.
