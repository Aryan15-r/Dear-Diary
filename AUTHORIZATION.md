# Authorization Model

This file is the source of truth for resource-level access control.

## Fundamental rule

Authentication answers:

> Who are you?

Authorization answers:

> Are you allowed to perform this action on this resource?

Being logged in is never enough.

## Roles

The minimum model is:

### Owner

The account that owns an entry.

Default permissions:

- Read
- Create
- Edit
- Delete
- Manage access

### Recipient

An account explicitly granted access.

Default permission:

- Read

Do not grant edit/delete/re-share unless explicitly required.

## Resource model

Resources include:

- Journal entry
- Audio
- Transcript
- Attachment

Every child resource inherits authorization from its parent entry unless a stricter rule is intentionally defined.

## Authorization algorithm

For a request:

```text
1. Authenticate requester.
2. Load resource.
3. Determine owner.
4. If requester is owner:
      allow according to owner action.
5. Otherwise:
      find active access grant.
6. Verify grant is not revoked.
7. Verify grant is not expired.
8. Verify requested action is included.
9. Allow or deny.
```

Failure must be deny-by-default.

## Example

```text
Account A owns Entry 123.

Account B requests Entry 123.

No grant:
→ DENY

Active view grant:
→ READ allowed

Account B tries PATCH:
→ DENY

Account B tries DELETE:
→ DENY

Account A revokes grant:
→ subsequent requests DENIED
```

## IDOR prevention

Never trust:

```text
/user/:userId/entry/:entryId
```

IDs.

Always resolve permissions from authenticated identity and database records.

## Sharing

Sharing must create a database permission record.

A secret URL is not a permission.

## Revocation

Revocation must:

- Mark the grant revoked.
- Prevent future access.
- Invalidate/expire temporary media access where practical.
- Be reflected in authorization checks immediately.

## Invitations

Invitation tokens must:

- Be unpredictable.
- Expire.
- Be single-use where appropriate.
- Not contain diary content.
- Not act as permanent authentication credentials.

## Re-sharing

Recipient users must not automatically be able to share an owner's entry with a third party.

## Bulk access

Do not implement “access to everything” unless explicitly required.

If bulk permissions are later added, document their scope precisely.

## Testing matrix

| Actor | Resource | Action | Expected |
|---|---|---|---|
| Owner | Own entry | Read | Allow |
| Owner | Own entry | Edit | Allow |
| Owner | Own entry | Delete | Allow |
| Recipient | Granted entry | Read | Allow |
| Recipient | Granted entry | Edit | Deny by default |
| Recipient | Granted entry | Delete | Deny |
| Recipient | Private entry | Read | Deny |
| Unauthenticated | Any private entry | Read | Deny |
| Other user | Unrelated audio | Read | Deny |
| Revoked recipient | Previously granted entry | Read | Deny |
