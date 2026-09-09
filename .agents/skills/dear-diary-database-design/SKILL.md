---
name: dear-diary-database-design
description: >-
  Relational schema structure, indexing strategy, transaction isolation, soft deletion, and security constraints for Dear Diary's database.
  Use when writing migrations, query optimizations, schema updates, or database access routines.
---

# Dear Diary — Database Architecture & Schema Specifications

This skill defines the complete relational schema, foreign key constraints, indexes, transactional boundaries, and security rules for the **Dear Diary** database.

---

## 1. Schema Definitions

### `users`
Stores core user account credentials and identity status.
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `sessions`
Tracks active user sessions using hashed session tokens.
```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `journal_entries`
Stores diary text content. Default visibility is private.
```sql
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    body TEXT,
    mood VARCHAR(50),
    tags VARCHAR(50)[],
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
```

### `audio_entries`
Metadata for private voice recordings linked to a journal entry.
```sql
CREATE TABLE audio_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    storage_key VARCHAR(512) NOT NULL,
    duration_seconds INT,
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
```

### `transcripts`
Transcription text generated from audio entries. Inherits permissions from audio/entry.
```sql
CREATE TABLE transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audio_entry_id UUID UNIQUE NOT NULL REFERENCES audio_entries(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    provider VARCHAR(100),
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `attachments`
Metadata for private image or document attachments linked to a journal entry.
```sql
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    storage_key VARCHAR(512) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
```

### `access_grants`
Explicit permission records for controlled sharing.
```sql
CREATE TABLE access_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL DEFAULT 'journal_entry',
    resource_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    permission VARCHAR(50) NOT NULL DEFAULT 'read',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    CONSTRAINT chk_different_users CHECK (owner_user_id <> recipient_user_id)
);
```

### `invitations`
Single-use invitation tokens for establishing trusted recipient relationships.
```sql
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_identifier VARCHAR(255),
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);
```

### `audit_logs`
Security audit trail. **MUST NOT** store diary body, transcripts, or passwords.
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 2. Indexing Requirements

Index high-frequency query paths to guarantee rapid lookups and eliminate full table scans:
- **Entries Lookups**: `CREATE INDEX idx_journal_entries_owner_date ON journal_entries (owner_user_id, entry_date DESC);`
- **Active Access Grants**: `CREATE INDEX idx_access_grants_lookup ON access_grants (resource_id, recipient_user_id) WHERE revoked_at IS NULL;`
- **Session Lookup**: `CREATE INDEX idx_sessions_token ON sessions (token_hash) WHERE revoked_at IS NULL;`
- **Invitation Validation**: `CREATE INDEX idx_invitations_token ON invitations (token_hash) WHERE accepted_at IS NULL AND revoked_at IS NULL;`

---

## 3. Transactional Safety & Soft Deletion

- **Multi-Step Security Transactions**: Accept invitation & grant creation, entry deletion & media deletion, and session revocation MUST run inside ACIS-compliant database transactions (`BEGIN ... COMMIT`).
- **Soft Deletion**: `journal_entries`, `audio_entries`, and `attachments` soft-delete via `deleted_at = NOW()`. Queries MUST filter `WHERE deleted_at IS NULL`.
