# Product Requirements Document

## 1. Product

**Name:** Dear Diary

**Type:** Private digital journaling application

**Primary experience:** Mobile-first web application for phones and tablets, with a responsive desktop experience.

## 2. Problem

Users want a private place to record thoughts, events, memories, text, and audio without requiring a social-media-style experience.

The product also supports controlled access to selected entries by another trusted account.

## 3. Goals

- Make writing a diary entry fast.
- Support text and audio journaling.
- Provide automatic transcription when configured.
- Keep entries private by default.
- Allow explicit, granular sharing.
- Make revocation simple.
- Provide useful organization and search.
- Work well on phones and iPads.
- Avoid unnecessary collection of personal data.

## 4. Non-goals

- Public social networking.
- Dating functionality.
- Public posting.
- Relationship-specific UI.
- One shared account.
- Password sharing.
- Security through obscurity.

## 5. Core features

### Authentication

- Registration
- Login
- Logout
- Password reset
- Session management
- Optional MFA if supported by the chosen stack

### Text diary

- Create
- Edit
- Delete
- Draft/autosave where appropriate
- Date/time
- Tags
- Mood
- Optional attachments

### Audio diary

- Browser recording
- Pause/resume
- Playback
- Upload fallback
- Delete
- Duration
- Private storage

### Transcription

- Optional transcription provider
- Editable transcript
- Same access control as source audio
- Clear handling of provider data

### Organization

- Timeline
- Calendar
- Search
- Tags
- Archive
- Filters

### Controlled access

- Invite another account
- Accept invitation
- Grant access to selected entries
- View-only by default
- Revoke access
- Optional expiration

## 6. Default behavior

New entries are private.

No entry becomes accessible to another account without an explicit permission record.

## 7. Functional requirements

Every protected resource must be checked against the authenticated user's permissions before being returned.

A recipient with view permission must not automatically gain:

- Edit
- Delete
- Re-share
- Ownership
- Access to unrelated entries

## 8. Notifications

Notifications must be generic and must not expose diary text, transcripts, or sensitive metadata.

Example:

`You have a new journal update.`

## 9. Acceptance criteria

A release is not complete until:

- Private entries cannot be read by unauthorized accounts.
- Changing resource IDs does not bypass authorization.
- Revoked access stops working.
- Private media cannot be fetched anonymously.
- Audio and transcripts follow identical permissions.
- Sensitive content does not appear in logs or URLs.
- Mobile layouts work on common phone/tablet sizes.
- Automated tests cover critical authorization paths.
