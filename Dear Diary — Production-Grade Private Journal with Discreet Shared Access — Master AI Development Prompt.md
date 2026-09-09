# DEAR DIARY
## Production-Grade Private Journal with Discreet Shared Access
### Master AI Development Prompt

You are an expert **senior full-stack engineer, security engineer, privacy engineer, UI/UX designer, database architect, DevOps engineer, and QA engineer**.

Build a production-quality, mobile-first private journaling web application called **“Dear Diary.”**

The application should feel like a **normal, polished personal journaling/productivity application**. It must not visually advertise relationships, couples, romantic communication, or “secret sharing.”

The application supports two independent user accounts where users can optionally grant another trusted account access to selected journal entries.

The most important principles are:

> **Normal-looking UI. Real privacy underneath. Discreet terminology. Server-enforced permissions. No security-through-obscurity.**

---

# 1. PRODUCT CONCEPT

Dear Diary is a private digital journal where users can:

- Write text diary entries.
- Record audio diary entries.
- Automatically transcribe audio.
- Edit transcripts.
- Organize entries.
- Search entries.
- Add dates, tags, moods, and optional attachments.
- Keep entries completely private.
- Optionally grant another trusted user access to selected entries.
- Revoke access whenever they want.
- View entries they have permission to access.

The application must support **two completely independent accounts**.

Example:

```text
Account A
│
├── Private entries
│
├── Selected entries accessible by Account B
│
└── Personal settings

Account B
│
├── Private entries
│
├── Selected entries accessible by Account A
│
└── Personal settings
```

Do NOT require either person to share their password.

Do NOT create one shared account.

Do NOT store shared passwords.

---

# 2. IMPORTANT UX REQUIREMENT — DISCREET SHARED ACCESS

The application should NOT contain obvious labels such as:

- “Shared With Boyfriend”
- “Shared With Girlfriend”
- “Couple Diary”
- “Partner”
- “Relationship”
- “Secret Room”
- “Private Couple Space”
- “Messages From Her”
- “Messages From Him”

Avoid unnecessary romantic visual language.

The application should look like a **normal journaling application**.

Use neutral terminology such as:

- My Diary
- Journal
- Entries
- Archive
- Notes
- Updates
- Collections
- Activity
- Saved
- Accessible Entries

The exact terminology should be chosen consistently throughout the UI.

The application should NOT falsely claim to be something it isn't. It should simply be a legitimate journaling product whose sharing functionality happens to be discreet.

---

# 3. SECURITY PRINCIPLE

Discreet UI is NOT the security mechanism.

Never implement security using:

- Hidden URLs.
- Secret paths.
- Unlisted pages.
- Obscure query parameters.
- CSS hiding.
- Client-side-only checks.
- “Nobody knows this URL” assumptions.
- Hardcoded secret codes.
- Shared passwords.
- Frontend-only authorization.

Even if somebody discovers every URL in the application, they must still be unable to access unauthorized information.

Every protected operation must be authorized **server-side**.

---

# 4. ACCOUNT SYSTEM

Each person must have their own account.

Authentication should include:

- Secure registration.
- Secure login.
- Logout.
- Password reset.
- Password hashing using a modern password hashing algorithm.
- Secure session management.
- Session expiration.
- Session revocation.
- Protection against brute-force login attempts.
- Rate limiting.
- Generic authentication error messages to reduce account enumeration.

Never store plaintext passwords.

Never send passwords to another user.

Never place credentials inside URLs.

Never expose authentication secrets to frontend JavaScript.

Use secure, HTTP-only cookies where appropriate.

Use:

```text
Secure
HttpOnly
SameSite
```

appropriately for authentication cookies.

---

# 5. TRUSTED USER / SHARING SYSTEM

Users should be able to grant another account access without revealing their password.

Implement a secure relationship/permission mechanism.

Possible flow:

```text
User A
   ↓
Chooses "Grant Access" / appropriate neutral wording
   ↓
Creates an invitation
   ↓
User B accepts
   ↓
Server establishes permission relationship
```

The exact UI wording should remain neutral.

The invitation must:

- Expire.
- Be single-use where appropriate.
- Be revocable.
- Be cryptographically unpredictable.
- Never contain permanent access credentials.
- Never directly expose private diary content.

Do not use permanent secret URLs as authentication.

---

# 6. ENTRY VISIBILITY

Each diary entry should have an explicit authorization state.

At minimum:

### PRIVATE

Only the owner can access it.

```text
PRIVATE
Owner → READ/WRITE
Other users → DENIED
```

### GRANTED ACCESS

The owner has explicitly granted a trusted account access.

```text
OWNER
→ READ
→ EDIT
→ DELETE
→ SHARE/REVOKE

AUTHORIZED USER
→ READ ONLY by default
→ No delete
→ No modification
→ No re-sharing unless explicitly permitted
```

The owner should be able to revoke access instantly.

When access is revoked:

```text
Previously accessible entry
        ↓
Permission revoked
        ↓
Other account receives 403/denied
```

Do not rely on hiding the entry from the UI. The backend must reject unauthorized requests.

---

# 7. DEFAULT PRIVACY

Every newly created diary entry must default to:

```text
PRIVATE
```

Sharing must always be an intentional action.

Never make entries publicly accessible by default.

Never make audio files public by default.

Never make attachments public by default.

Never expose diary content through search engines.

Never expose diary content through public APIs.

---

# 8. MOBILE-FIRST EXPERIENCE

The primary users are expected to use:

- Phones.
- iPhones.
- Android phones.
- iPads.
- Small tablets.

Design mobile-first.

The desktop version should still work properly.

Requirements:

- Responsive layout.
- Large touch targets.
- Comfortable typography.
- Bottom navigation where appropriate.
- Thumb-friendly controls.
- Mobile-safe dialogs.
- Mobile audio recording controls.
- Swipe-friendly timeline/calendar interactions.
- No unnecessary horizontal scrolling.
- Good keyboard behavior.
- Proper handling of mobile browser viewport changes.
- Support both portrait and landscape where appropriate.

Do not simply shrink a desktop interface.

Design the mobile experience first.

---

# 9. HOME / DASHBOARD

The authenticated home page should look like a normal journal dashboard.

Possible structure:

```text
Dear Diary

[ Today ]

Good evening

[ + New Entry ]

Recent Entries
----------------
Entry
Entry
Entry

Journal
Archive
Search
Settings
```

Keep the interface calm, clean, and ordinary.

Avoid:

- Couple imagery.
- Hearts.
- Romantic animations.
- Relationship labels.
- Suspicious hidden sections.
- “Secret” terminology.

---

# 10. JOURNAL ENTRY CREATION

Users should be able to create:

### Text Entry

Fields:

- Title.
- Body.
- Date/time.
- Optional mood.
- Optional tags.
- Optional attachment.
- Visibility/access setting.

The editor should support:

- Autosave.
- Drafts.
- Manual save.
- Edit.
- Delete.
- Restore from draft where appropriate.

Prevent accidental data loss.

---

# 11. AUDIO DIARY

Users should be able to record an audio diary directly from supported devices.

Provide:

- Record.
- Pause.
- Resume.
- Stop.
- Playback.
- Delete.
- Rename.
- Duration display.
- Recording date.
- Upload fallback if browser recording isn't supported.

Audio files must be stored privately.

Do not expose raw storage URLs.

Use secure short-lived signed URLs or an authenticated streaming/download endpoint.

---

# 12. AUDIO TRANSCRIPTION

If automatic transcription is implemented:

```text
Audio
 ↓
Private processing
 ↓
Transcript
 ↓
Editable transcript
```

The transcript must obey the **same access permissions as the original audio**.

If an entry is private:

```text
Audio → Private
Transcript → Private
```

If access is granted:

```text
Audio → Authorized user
Transcript → Authorized user
```

Do not accidentally make the transcript public while keeping the audio private.

Do not send private audio or transcripts to third-party AI services unless:

1. The user has been informed.
2. The service is actually required.
3. Appropriate privacy protections are implemented.
4. Secrets are stored server-side.
5. Data retention is understood and minimized.

---

# 13. SHARED/ACCESSIBLE CONTENT UI

Do not use an obvious relationship-specific navigation item.

Instead, use ordinary application concepts.

For example:

```text
Journal
Archive
Notes
Updates
Collections
```

The exact implementation can vary.

A user who has authorized access to another user's entries should be able to access them through a normal-looking section.

For example:

```text
Journal

My Entries
Accessible Entries
```

or another equally neutral structure.

Do not display the other person's romantic relationship to the viewer.

Do not display unnecessary identity information.

If a person's name is shown, it should be because the product genuinely needs it.

---

# 14. ENTRY DETAILS

An entry page should contain:

- Title.
- Date.
- Body.
- Audio player if applicable.
- Transcript if applicable.
- Tags.
- Mood.
- Attachments.
- Appropriate access indicator.

Access indicators should remain subtle and neutral.

For example:

```text
Private
Access granted
```

Avoid:

```text
Shared with my girlfriend ❤️
```

Do not expose permissions to users who are not authorized to see them.

---

# 15. ACCESS REVOCATION

The owner must be able to revoke access.

Example:

```text
Entry
 ↓
Access settings
 ↓
Revoke access
 ↓
Server removes permission
 ↓
Previously authorized user can no longer access entry
```

Revocation must happen server-side.

Previously generated temporary media URLs should expire quickly.

If practical, use a short TTL for signed URLs.

---

# 16. DATABASE DESIGN

Use a proper relational database.

Suggested conceptual tables:

```text
users
sessions
journal_entries
audio_entries
attachments
transcripts
access_grants
invitations
audit_logs
password_reset_tokens
```

Example relationship:

```text
users
  │
  ├── journal_entries
  │
  ├── audio_entries
  │
  └── access_grants
          │
          ├── owner_user_id
          ├── recipient_user_id
          ├── resource_id
          ├── permission
          ├── created_at
          ├── revoked_at
          └── expires_at
```

Use foreign keys where supported.

Use indexes for common queries.

Use transactions for security-sensitive operations.

Use database constraints where possible.

---

# 17. AUTHORIZATION MODEL

Authorization must be explicit.

Before returning an entry:

```text
Is requester authenticated?
        ↓
Does requester own entry?
        ↓
OR
Does requester have active access grant?
        ↓
If neither → DENY
```

Never do:

```javascript
if (userIsLoggedIn) {
    return entry;
}
```

Do:

```text
authenticate
+
authorize resource
+
return only permitted data
```

Every API endpoint must independently enforce authorization.

---

# 18. PREVENT IDOR / BOLA

This is extremely important.

Never trust:

```text
/user/123/entry/456
```

simply because the requester is authenticated.

Always verify that entry `456` belongs to the authenticated user or is explicitly accessible through a valid permission record.

Test:

```text
Account A requests Account B's entry
→ DENIED

Account A changes entry ID
→ DENIED

Account A changes user ID
→ DENIED

Account A guesses attachment ID
→ DENIED

Account A guesses audio ID
→ DENIED
```

Never rely on UUIDs alone for authorization.

UUIDs can help reduce enumeration but are NOT authorization.

---

# 19. API SECURITY

Every protected endpoint must validate:

- Authentication.
- Authorization.
- Input format.
- Data ownership.
- Permission state.
- Resource existence.

Use appropriate status codes:

```text
401 → unauthenticated
403 → authenticated but unauthorized
404 → resource unavailable/not exposed
400/422 → invalid input
429 → rate limited
```

Do not leak unnecessary information through error messages.

---

# 20. INPUT SECURITY

All user-provided input must be treated as untrusted.

Protect against:

- XSS.
- SQL injection.
- HTML injection.
- Command injection.
- Path traversal.
- Malicious filenames.
- Malicious metadata.
- Prototype pollution where applicable.
- SSRF where applicable.

Use:

- Parameterized queries.
- Proper output encoding.
- HTML sanitization where rich text is supported.
- Strict schema validation.
- Safe file handling.

Never concatenate raw user input into SQL queries.

---

# 21. FILE UPLOAD SECURITY

Attachments and audio uploads must be handled securely.

Validate:

- File type.
- MIME type.
- File extension.
- File size.
- Actual file signature where practical.

Do not trust:

```text
Content-Type
```

alone.

Generate safe server-side filenames.

Do not use the original filename as a storage path.

Store uploads outside public web roots.

Do not expose bucket/container listings.

Use private object storage.

Use authenticated access or short-lived signed URLs.

---

# 22. PRIVATE STORAGE

Diary data must never accidentally become publicly accessible.

Storage should follow:

```text
Private bucket/storage
        ↓
Authenticated request
        ↓
Authorization check
        ↓
Short-lived signed URL / secure stream
```

Never:

```text
/public/diary/audio.mp3
```

Never put sensitive diary content in:

- Public CDN paths.
- Public Git repositories.
- Source code.
- HTML source.
- JavaScript bundles.
- Query strings.
- Analytics payloads.

---

# 23. BROWSER PRIVACY

Be extremely careful about what appears in the browser.

Do not place diary content into:

- URL parameters.
- URL fragments.
- Page titles unnecessarily.
- Meta descriptions.
- Open Graph metadata.
- Analytics events.
- Third-party tracking.
- Console logs.
- Error reporting payloads.
- Browser storage unnecessarily.

Avoid:

```text
/journal?entry=MySecretDiaryText
```

Prefer:

```text
/journal/entry/<opaque-id>
```

with server-side authorization.

Even then, never assume the opaque ID is secret.

---

# 24. NOTIFICATIONS

Notifications must be generic.

Never send sensitive diary text through:

- Browser notifications.
- Email notifications.
- Push notifications.
- SMS.
- Notification previews.

Good:

```text
You have a new journal update.
```

Bad:

```text
Stakshi wrote: "I miss you so much..."
```

Never expose private content on lock-screen notifications.

---

# 25. CACHE CONTROL

Private pages and API responses must be configured so sensitive information is not accidentally cached publicly.

Review:

```text
Cache-Control
ETag
CDN caching
Service worker caching
Browser caching
Proxy caching
```

Do not cache personalized private responses publicly.

Be especially careful with:

- Audio.
- Images.
- Attachments.
- Transcripts.
- Entry API responses.

---

# 26. SEARCH ENGINE PRIVACY

The authenticated journal must not be indexed.

Implement appropriate protections such as:

- Authentication requirements.
- `noindex` where applicable.
- Correct robots configuration for public portions.
- No public journal URLs.
- No public sitemap entries for private resources.

Do not mistake `robots.txt` for security.

Authentication and authorization remain mandatory.

---

# 27. LOGGING

Logs must help debugging and security without becoming a second privacy vulnerability.

Never log:

- Passwords.
- Authentication tokens.
- Session cookies.
- Private diary bodies.
- Audio contents.
- Full transcripts.
- Sensitive attachment contents.

Audit logs may record events such as:

```text
ENTRY_CREATED
ENTRY_UPDATED
ENTRY_DELETED
ACCESS_GRANTED
ACCESS_REVOKED
AUTHORIZED_ENTRY_VIEWED
LOGIN_SUCCESS
LOGIN_FAILURE
PASSWORD_RESET
```

Use IDs rather than sensitive content.

---

# 28. ACCESS HISTORY

If an access-history feature is implemented, it should remain neutral.

Example:

```text
Recent activity

Entry accessed
Entry updated
Access permission changed
```

Do not create unnecessarily revealing descriptions.

Do not put diary content inside activity logs.

---

# 29. SECURITY HEADERS

Implement appropriate security headers, including where applicable:

```text
Content-Security-Policy
Strict-Transport-Security
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
Frame-ancestors
```

Do not blindly copy a CSP without testing the application.

Do not weaken security headers merely to make a library work.

---

# 30. HTTPS

Production traffic must use HTTPS.

Do not transmit:

- Passwords.
- Session tokens.
- Diary content.
- Audio.
- Attachments.

over unencrypted HTTP.

Redirect HTTP to HTTPS where appropriate.

---

# 31. CSRF PROTECTION

If cookie-based authentication is used, protect state-changing requests against CSRF.

Review:

- SameSite cookie policy.
- CSRF tokens where appropriate.
- Origin/Referer validation where appropriate.
- CORS configuration.

Never use:

```text
Access-Control-Allow-Origin: *
```

with credentialed private APIs.

---

# 32. CORS

Use a strict allowlist.

Only trusted application origins should access authenticated APIs.

Do not configure permissive CORS merely because it is convenient during development.

Development and production configuration should be separated.

---

# 33. RATE LIMITING

Apply rate limits to:

- Login.
- Registration.
- Password reset.
- Invitation creation.
- Invitation acceptance.
- Audio uploads.
- Transcription requests.
- API requests.
- Resource-intensive operations.

Use stricter limits for authentication endpoints.

---

# 34. SECRET MANAGEMENT

Never hardcode:

- Database passwords.
- API keys.
- JWT secrets.
- OAuth secrets.
- Encryption keys.
- Storage credentials.
- AI API keys.

Use environment variables or a proper secrets manager.

Never commit secrets to Git.

Provide:

```text
.env.example
```

with placeholders only.

---

# 35. ENCRYPTION

Use encryption in transit and at rest where supported.

For highly sensitive data, evaluate application-level encryption where appropriate.

Do not invent custom cryptography.

Do not implement homemade encryption algorithms.

Use well-reviewed cryptographic libraries.

Protect encryption keys separately from encrypted data.

---

# 36. DELETE FUNCTIONALITY

When users delete an entry:

- Require appropriate authorization.
- Consider confirmation for destructive actions.
- Remove associated media appropriately.
- Remove or invalidate access grants where appropriate.
- Ensure deleted data isn't still accessible through old URLs.
- Consider retention requirements and backups.

If soft deletion is used:

```text
Deleted
→ inaccessible to users
→ excluded from normal queries
```

Do not let deleted resources remain accessible merely because someone knows the old ID.

---

# 37. BACKUPS

Backups must be:

- Private.
- Access-controlled.
- Encrypted where appropriate.
- Tested for restoration.
- Protected from public exposure.

Do not make backup files publicly accessible.

Document retention and deletion policies.

---

# 38. UI PRIVACY

The interface should avoid unnecessarily displaying sensitive information when someone casually sees the screen.

Examples:

Instead of:

```text
Shared with my girlfriend
```

Use:

```text
Access granted
```

Instead of:

```text
Messages from Stakshi
```

Use:

```text
Updates
```

Instead of:

```text
Secret Couple Diary
```

Use:

```text
Journal
```

Do not overdo this.

The application should feel natural, not suspiciously disguised.

---

# 39. OPTIONAL QUICK PRIVACY FEATURES

Consider useful privacy features such as:

### App Lock

Optional PIN/biometric/device authentication where technically appropriate.

### Auto-lock

Automatically lock the journal after inactivity.

### Hide Preview

Optional setting preventing entry text from appearing in recent-item previews.

### Session Management

Allow the user to view and revoke active sessions.

### Device Management

Allow users to see recognized devices where practical.

These features must complement—not replace—proper authentication and authorization.

---

# 40. ACCESSIBILITY

Support:

- Keyboard navigation.
- Screen readers.
- Sufficient contrast.
- Visible focus states.
- Semantic HTML.
- Accessible labels.
- Accessible forms.
- Accessible audio controls.
- Reduced-motion preferences.

Do not sacrifice accessibility for visual effects.

---

# 41. DESIGN LANGUAGE

Use a polished, calm, modern journaling aesthetic.

Possible characteristics:

- Clean cards.
- Soft spacing.
- Subtle shadows.
- Elegant typography.
- Minimal animations.
- Smooth transitions.
- Comfortable reading width.
- Dark/light mode.
- Calm neutral colors.

Avoid making it look like:

- A dating app.
- A messaging app.
- A social media platform.
- A “secret communication” website.

It should look like a legitimate premium journaling product.

---

# 42. DARK MODE

Support:

```text
Light
Dark
System
```

where practical.

Ensure:

- Proper contrast.
- Readable diary text.
- Accessible controls.
- Correct media player styling.
- No flashing transitions.

Remember the user's theme preference.

---

# 43. PERFORMANCE

Optimize for mobile networks.

Use:

- Lazy loading.
- Pagination.
- Efficient database queries.
- Image compression.
- Audio streaming.
- Appropriate caching.
- Code splitting where appropriate.
- Optimized assets.

Do not load an entire diary history on every page load.

---

# 44. DATA MINIMIZATION

Only collect information necessary for the product.

Do not add unnecessary:

- Tracking.
- Analytics.
- Personal profiles.
- Location collection.
- Device fingerprinting.
- Third-party advertising.

If analytics are used, minimize sensitive data.

Never send diary contents to analytics systems.

---

# 45. NO DARK PATTERNS

Do not:

- Make sharing the default.
- Hide privacy settings.
- Make deletion intentionally difficult.
- Trick users into granting access.
- Use misleading permission dialogs.
- Automatically share entries.
- Automatically upload audio without clear action.

Privacy controls should be understandable.

---

# 46. ERROR HANDLING

Errors should be useful without exposing internals.

Never show users:

```text
SQL error
Stack trace
Database credentials
Internal filesystem paths
Secret tokens
Environment variables
```

Production errors should be generic.

Detailed diagnostics should remain server-side.

---

# 47. DEVELOPMENT ENVIRONMENT

Maintain a clean project structure.

Separate:

```text
frontend
backend
database
authentication
storage
services
components
utilities
tests
configuration
```

depending on the chosen stack.

Do not create a giant monolithic file unless absolutely necessary.

Use clear naming.

Use reusable components.

Avoid unnecessary dependencies.

---

# 48. ENVIRONMENT SEPARATION

Maintain separate:

```text
development
staging
production
```

configuration where possible.

Never use production secrets locally unless necessary.

Never expose development debugging endpoints in production.

---

# 49. NO DEVELOPMENT BACKDOORS

Never implement:

```text
?admin=true
?debug=true
?bypass=true
```

or hidden master passwords.

Never create:

- Secret admin accounts.
- Universal access tokens.
- Hardcoded bypass credentials.
- Hidden API endpoints that skip authorization.

Testing tools must be disabled or protected in production.

---

# 50. TESTING REQUIREMENTS

Create tests for:

### Authentication

```text
Valid login → success
Invalid login → failure
Expired session → denied
Revoked session → denied
```

### Authorization

```text
Owner → allowed
Authorized recipient → allowed
Unauthorized user → denied
Logged-out user → denied
```

### IDOR

```text
Change entry ID → denied
Change user ID → denied
Guess audio ID → denied
Guess attachment ID → denied
```

### Sharing

```text
Grant access → allowed
Accept invitation → allowed
Revoke access → denied afterward
Expired invitation → denied
Reuse invitation → denied
```

### Files

```text
Unauthorized audio request → denied
Unauthorized attachment request → denied
Expired signed URL → denied
```

### Security

Test for:

- XSS.
- SQL injection.
- CSRF.
- Rate-limit bypass.
- Session fixation.
- Broken access control.
- CORS misconfiguration.
- Sensitive data exposure.
- Cache leaks.

---

# 51. SECURITY AUDIT BEFORE RELEASE

Before considering the application complete, perform a security review.

Ask:

```text
Can another user access someone else's entry?

Can changing an ID expose another resource?

Can an unauthenticated request retrieve audio?

Can an old signed URL remain valid too long?

Can revoked users still access previously shared content?

Can diary content appear in logs?

Can diary content appear in browser notifications?

Can diary content appear in page source?

Can diary content appear in URLs?

Can private APIs be accessed from arbitrary origins?

Are production secrets exposed?

Are uploaded files publicly accessible?

Can deleted entries still be downloaded?

Can rate limits be bypassed?

Can sessions be hijacked?

Can an attacker enumerate users?

Can a user grant themselves unauthorized access?

Can one account modify another account's diary?
```

Do not declare the project secure merely because authentication exists.

---

# 52. IMPORTANT ANTI-MISTAKES RULE

Never implement a feature just because it appears visually correct.

For every privacy-sensitive feature, verify:

```text
UI
↓
API
↓
Authorization
↓
Database
↓
Storage
↓
Caching
↓
Logging
```

All layers must respect the same privacy model.

---

# 53. FRONTEND SECURITY RULE

Never trust frontend state.

This is NOT sufficient:

```javascript
if (entry.ownerId === currentUser.id) {
    showEntry();
}
```

The frontend can be modified by an attacker.

The backend must independently enforce:

```text
current authenticated user
+
resource ownership/access grant
+
permission
```

before returning data.

---

# 54. PRIVACY MODEL

Use this conceptual model:

```text
                    DEAR DIARY
                         │
             ┌───────────┴───────────┐
             │                       │
         ACCOUNT A               ACCOUNT B
             │                       │
       ┌─────┴─────┐           ┌─────┴─────┐
       │           │           │           │
   Private     Granted      Private     Granted
   Entries     Entries      Entries     Entries
       │           │           │           │
       │           └──────┬────┘           │
       │                  │                │
       └────────── Server Authorization ───┘
```

No account should automatically receive access to the other's entire diary.

---

# 55. SHARING GRANULARITY

Prefer granular permissions.

Possible levels:

```text
Private
View only
View audio
View transcript
```

Do not automatically grant edit/delete permissions.

The safest default for another user is:

```text
READ ONLY
```

---

# 56. FUTURE EXTENSIBILITY

Design the architecture so it can later support:

- Multiple trusted users.
- Shared collections.
- Group journals.
- Family journals.
- Collaborative journals.
- Temporary access.
- Expiring access.
- Different permission levels.

However, do not build unnecessary complexity before the core application works.

---

# 57. NO FAKE FEATURES

If a feature isn't actually implemented, do not display it as working.

Do not create fake:

- Transcription.
- Authentication.
- Database persistence.
- Encryption.
- Notifications.
- Storage.
- AI features.

If a feature requires an external service, clearly isolate the integration.

---

# 58. README

Create a professional README containing:

- Project overview.
- Architecture.
- Installation.
- Environment variables.
- Database setup.
- Storage setup.
- Authentication setup.
- Development commands.
- Production deployment.
- Security considerations.
- Testing.
- Known limitations.

Never put real secrets in the README.

---

# 59. FINAL DEVELOPMENT PROCESS

Before writing the application:

### Step 1 — Architecture

Define:

- Frontend.
- Backend.
- Database.
- Authentication.
- Storage.
- Transcription service if required.
- Deployment architecture.

### Step 2 — Threat Model

Identify:

- Unauthorized users.
- Compromised sessions.
- IDOR/BOLA.
- Malicious uploads.
- XSS.
- CSRF.
- Credential attacks.
- Data leakage.
- Cache leakage.
- Storage exposure.

### Step 3 — Database

Design the schema and permission model.

### Step 4 — Authentication

Implement secure authentication.

### Step 5 — Authorization

Implement resource-level authorization before building sharing UI.

### Step 6 — Journal

Build private text entries.

### Step 7 — Audio

Build private audio recording/storage.

### Step 8 — Transcription

Add secure transcription if required.

### Step 9 — Controlled Access

Implement trusted-user invitations and per-entry permissions.

### Step 10 — Mobile UI

Optimize for phone/iPad.

### Step 11 — Testing

Test normal functionality and attack scenarios.

### Step 12 — Security Audit

Perform a final security review.

---

# 60. MOST IMPORTANT PRODUCT RULES

Always follow these rules:

1. **Each person gets their own account.**
2. **Never ask users to share passwords.**
3. **Every diary entry is private by default.**
4. **Sharing must be explicit.**
5. **Sharing permissions are enforced server-side.**
6. **Revocation must work immediately.**
7. **Audio follows the same permissions as text.**
8. **Transcripts follow the same permissions as audio.**
9. **Private content must never appear in public URLs.**
10. **Private content must never appear in analytics.**
11. **Private content must never appear in logs unnecessarily.**
12. **Private content must never appear in notifications.**
13. **Private storage must remain private.**
14. **Never rely on hidden URLs for security.**
15. **Never trust frontend authorization.**
16. **Never expose secrets.**
17. **Never create development backdoors.**
18. **Never make sharing obvious or relationship-specific in the interface.**
19. **Keep the UI natural and consistent with a normal journaling product.**
20. **Use defense in depth.**

---

# 61. FINAL DESIGN PHILOSOPHY

The finished application should feel like:

> “A polished personal digital diary.”

Not:

> “A secret website designed to hide communication.”

The discretion should come from **normal product design and neutral terminology**, while actual confidentiality must come from **strong authentication, authorization, private storage, access control, secure infrastructure, and data minimization.**

The result should be a legitimate journaling application that two trusted users can use independently while selectively giving one another access to specific entries.

Build it as if it were going into production for real users.

Do not take shortcuts with privacy or security.

**Defense in depth + least privilege + secure authentication + server-side authorization + private storage + data minimization + secure infrastructure + careful logging + continuous security testing are mandatory.**