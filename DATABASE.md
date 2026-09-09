# Database Design

## Goals

The database must support private journaling, media metadata, controlled sharing, invitations, sessions, and security auditing.

## Core tables

### users

Suggested fields:

```text
id
email
password_hash
display_name
created_at
updated_at
status
```

Store only necessary account information.

### sessions

```text
id
user_id
token_hash or equivalent
created_at
expires_at
revoked_at
last_seen_at
```

Never store raw session secrets when the architecture can safely avoid doing so.

### journal_entries

```text
id
owner_user_id
title
body
entry_date
created_at
updated_at
deleted_at
```

Default visibility is private.

### audio_entries

```text
id
journal_entry_id
storage_key
duration_seconds
mime_type
created_at
deleted_at
```

### transcripts

```text
id
audio_entry_id
text
provider
status
created_at
updated_at
```

### attachments

```text
id
journal_entry_id
storage_key
original_name
mime_type
size_bytes
created_at
deleted_at
```

### access_grants

```text
id
owner_user_id
recipient_user_id
resource_type
resource_id
permission
created_at
expires_at
revoked_at
```

Use constraints to prevent invalid owner/recipient combinations where appropriate.

### invitations

```text
id
inviter_user_id
invitee_identifier
token_hash
created_at
expires_at
accepted_at
revoked_at
```

Do not store permanent plaintext invitation secrets.

### audit_logs

```text
id
actor_user_id
action
resource_type
resource_id
created_at
metadata
```

Metadata must not contain diary content or credentials.

## Indexing

Index fields used frequently for:

- Owner lookups
- Entry dates
- Active grants
- Session expiration
- Invitation expiration

## Transactions

Use transactions for security-sensitive multi-step operations such as accepting an invitation and creating permissions.

## Deletion

Define how soft deletion, media deletion, grants, and backups interact.

## Database security

Use least-privilege database credentials.

Never expose the database directly to browsers.
