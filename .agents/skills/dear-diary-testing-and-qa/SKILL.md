---
name: dear-diary-testing-and-qa
description: >-
  Test strategy, authorization testing matrix, IDOR test suites, privacy leak audits, and release gates for Dear Diary.
  Use when writing unit/integration/API tests, running QA procedures, or validating security boundaries.
---

# Dear Diary — Testing Strategy & QA Matrix

This skill outlines the mandatory testing procedures, authorization testing matrix, IDOR test scripts, privacy leak checks, and release gate criteria for **Dear Diary**.

---

## 1. Authorization & Access Control Testing Matrix

Every security release MUST execute and pass this matrix of access control tests across all resource endpoints (`/entries/:id`, `/audio/:id`, `/audio/:id/transcript`, `/attachments/:id`).

| Requester Actor | Target Resource | Requested Action | Expected Result | HTTP Status |
| :--- | :--- | :--- | :--- | :--- |
| **Owner** | Own Entry / Media | Read / Edit / Delete | **ALLOW** | `200 OK` / `204 No Content` |
| **Recipient (Active Grant)** | Granted Entry / Media | Read | **ALLOW** | `200 OK` |
| **Recipient (Active Grant)** | Granted Entry / Media | Edit / Delete | **DENY** | `403 Forbidden` |
| **Recipient (Revoked Grant)**| Previously Granted Entry | Read | **DENY** | `403 Forbidden` / `404` |
| **Recipient (Expired Grant)**| Expired Granted Entry | Read | **DENY** | `403 Forbidden` / `404` |
| **Unauthorized User** | Private Entry | Read / Edit / Delete | **DENY** | `403 Forbidden` / `404` |
| **Unauthenticated User** | Any Private Resource | Read / Edit / Delete | **DENY** | `401 Unauthorized` |

---

## 2. Mandatory IDOR / BOLA Prevention Tests

Automated API test suites MUST explicitly execute IDOR vector attacks:
1. **Entry BOLA Test**:
   - Account A creates Entry `E_100`.
   - Account B authenticates and calls `GET /entries/E_100`, `PATCH /entries/E_100`, `DELETE /entries/E_100`.
   - **Assert**: All calls from Account B MUST fail with `403` or `404`.
2. **Audio BOLA Test**:
   - Account A uploads Audio `A_200` for Entry `E_100`.
   - Account B calls `GET /audio/A_200`.
   - **Assert**: Must fail with `403` or `404`. Signed URL generation MUST NOT occur for Account B.
3. **Transcript BOLA Test**:
   - Account A generates Transcript `T_300` for Audio `A_200`.
   - Account B calls `GET /audio/A_200/transcript`.
   - **Assert**: Must fail with `403` or `404`.
4. **Attachment BOLA Test**:
   - Account A attaches File `F_400` to Entry `E_100`.
   - Account B calls `GET /attachments/F_400`.
   - **Assert**: Must fail with `403` or `404`.

---

## 3. Privacy & Log Leakage Audits

Run automated log and response verification tests to ensure zero sensitive data exposure:
- **Server Log Inspection**: Grep backend application logs after running test suites to verify that NO entry titles, bodies, audio data, transcripts, password hashes, or session tokens exist in log files.
- **URL Parameter Inspection**: Verify that no route handlers or frontend navigation code appends entry body text or search queries into browser history or URL query strings.
- **Cache Header Inspection**: Verify that responses for private entries return `Cache-Control: private, no-store, no-cache, must-revalidate`.

---

## 4. Pre-Release Verification Checklist

A code release CANNOT be deployed to production until all items below pass:
- [ ] All unit, integration, and API authorization tests pass 100%.
- [ ] IDOR attack simulation tests return zero authorization bypasses.
- [ ] Revoking an access grant immediately blocks subsequent `GET` requests from recipient.
- [ ] Object storage bucket blocks unauthenticated direct HTTP reads (`403 Access Denied`).
- [ ] Session tokens use `HttpOnly`, `Secure`, `SameSite` flags.
- [ ] Mobile responsive layout tested on iPhone and Android screen widths (375px - 430px).
- [ ] Zero secret keys or environment credentials found in source code.
