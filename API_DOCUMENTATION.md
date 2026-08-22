# WhatsApp Campaign Management — API Documentation

This document describes every API endpoint the frontend expects, so the
backend can be built to match exactly. It mirrors `src/api/endpoints.js`
(endpoint paths) and `src/api/mockApi.js` (response shapes / demo logic).

- **Base URL:** configurable via `VITE_API_BASE_URL` (defaults to `/api/v1`)
- **Auth:** Bearer JWT in `Authorization` header, attached automatically by
  the axios interceptor (`src/api/axiosInstance.js`)
- **Multi-tenancy:** every authenticated request also sends `X-Tenant-Id`,
  resolved from the logged-in Reseller/Client
- **Format:** JSON everywhere except file uploads (`multipart/form-data`)
- **Pagination convention:** `?page=1&limit=20` → response includes
  `{ data: [...], total, page, limit }`
- **Errors:** `{ message: string, code?: string, errors?: object }`
  with standard HTTP status codes (400, 401, 403, 404, 409, 422, 500)

---

## 1. Authentication (Virtual Number Login)

Login is virtual-number based: the user enters their WhatsApp Business
virtual number, receives an OTP, and on verification the account is
connected to the WhatsApp Business API.

### `POST /auth/request-otp`
Request an OTP be sent to a virtual number.
```json
// Request
{ "virtualNumber": "+91 92345 00110" }

// Response 200
{ "sent": true, "expiresIn": 300 }
```

### `POST /auth/verify-otp`
Verify the OTP and start a session.
```json
// Request
{ "virtualNumber": "+91 92345 00110", "otp": "123456" }

// Response 200
{
  "accessToken": "jwt...",
  "refreshToken": "jwt...",
  "user": {
    "id": "usr_1",
    "name": "Infyle Demo Reseller",
    "role": "Reseller",          // SuperAdmin | Reseller | Client
    "virtualNumber": "+91 92345 00110",
    "businessName": "Infyle Technologies",
    "waBusinessStatus": "connected"
  }
}
```

### `POST /auth/refresh-token`
```json
// Request
{ "refreshToken": "jwt..." }
// Response 200
{ "accessToken": "jwt..." }
```

### `GET /auth/me`
Returns current user, role, and tenant — used to gate UI features by
permission on app load.

### `POST /auth/logout`
Invalidates the refresh token server-side.

---

## 2. Dashboard

### `GET /dashboard/summary`
```json
{
  "totalCampaigns": 8,
  "activeCampaigns": 1,
  "completedCampaigns": 4,
  "scheduledCampaigns": 2,
  "failedCampaigns": 1,
  "totalContacts": 7,
  "availableCredits": 12480,
  "consumedCredits": 1070,
  "walletStatus": "active",       // active | suspended
  "messagesSentToday": 740,
  "successRate": 96.4
}
```

### `GET /dashboard/performance?range=7d`
Returns a time series for the sent/failed chart.
```json
[
  { "day": "Mon", "sent": 420, "failed": 12 },
  ...
]
```

### `GET /dashboard/activity?limit=6`
Returns the most recent campaigns (same shape as Campaign object, §3).

---

## 3. Campaigns — "Send via WA"

### Campaign object shape
```json
{
  "id": "CMP-2041",
  "name": "Diwali Offer Blast",
  "message": "Get 20% off this Diwali!",
  "mediaType": "image",          // none | image | video | pdf
  "mediaUrl": "https://cdn.../diwali-banner.jpg",
  "mediaName": "diwali-banner.jpg",
  "status": "completed",         // draft | scheduled | processing | completed | failed | cancelled | paused
  "type": "instant",             // instant | scheduled | draft
  "totalContacts": 640,
  "sent": 618,
  "failed": 22,
  "pending": 0,
  "createdAt": "2026-08-11T14:05:00Z",
  "completedAt": "2026-08-11T15:40:00Z",
  "scheduledAt": null
}
```

### `GET /campaigns?page=&limit=&status=&search=`
List/filter campaigns for WA History.

### `POST /campaigns`
Create a campaign. `multipart/form-data`:
| field | type | notes |
|---|---|---|
| `name` | string | broadcast name |
| `message` | string | text message |
| `contactListId` | string | id returned by the contact import step |
| `mediaType` | string | none / image / video / pdf |
| `media` | file | required if mediaType != none. **Limits: image ≤5MB, video ≤30MB, pdf ≤5MB** |
| `scheduledAt` | ISO date | omit for instant send |
| `saveAsDraft` | boolean | true = don't process yet |

Server-side, on create (non-draft, non-scheduled):
1. Validate wallet is not suspended (`403 CREDIT_SUSPENDED` if so)
2. Validate sufficient credit balance (`402` / `INSUFFICIENT_CREDITS`)
3. Deduct estimated credits, log a `debit` entry in credit history
4. Enqueue the campaign onto the message queue (RabbitMQ) — only between
   **10:00 AM–6:00 PM on working days**; outside this window, hold until
   the next valid window
5. Return the created Campaign object

### `PUT /campaigns/:id` — edit a draft/scheduled campaign
### `DELETE /campaigns/:id` — delete a draft
### `POST /campaigns/:id/start` / `/pause` / `/resume` / `/cancel`
### `GET /campaigns/:id/status` — lightweight polling endpoint, or replace
with a WebSocket/SSE channel emitting `{ sent, failed, pending, status }`
### `POST /campaigns/preview-recipients`
Given an uploaded contact file, returns a row count + validation preview
before the user commits to saving it (dedupe / invalid number count).

---

## 4. WA History

### `GET /wa-history?page=&limit=&dateFrom=&dateTo=&status=`
Same as `GET /campaigns` but intended for the read-only history view —
backend may alias this directly to the campaigns list.

### `GET /wa-history/:id`
Full delivery breakdown for one campaign (per-recipient status, if tracked).

### `GET /wa-history/export?format=excel|pdf&...filters`
Streams a file download of the filtered history.

---

## 5. Scheduled Campaigns

### `GET /campaigns/scheduled?page=&limit=`
Campaigns with `status = scheduled`.

### `POST /campaigns/:id/schedule`
```json
{ "scheduledAt": "2026-08-16T10:00:00Z" }
```

### `PUT /campaigns/:id/schedule` — reschedule
### `DELETE /campaigns/:id/schedule` — cancel the schedule (→ status `cancelled`)
### `POST /campaigns/:id/run-now`
Immediately promotes a scheduled campaign into the processing queue
("Schedule now" action in the UI).

---

## 6. Contacts — "Manage Users"

### Contact object shape
```json
{
  "id": "U-501",
  "name": "Rohit Sharma",
  "phone": "+91 98765 43210",
  "group": "VIP Customers",
  "source": "manual",           // manual | csv | excel | pdf
  "status": "valid",            // valid | invalid | duplicate
  "addedOn": "2026-08-10T10:00:00Z"
}
```

### `GET /contacts?page=&limit=&groupId=&search=`
### `POST /contacts` — add one contact manually
### `POST /contacts/bulk-import`
`multipart/form-data`, field `file` (`.csv`, `.xlsx`, `.xls`, `.pdf`).
Server should:
1. Parse rows (PDF via text/table extraction)
2. Normalize phone numbers, detect country code
3. De-duplicate against existing contacts
4. Flag invalid numbers
5. Return a summary + kick off an async job for large files

```json
// Response 200 (sync) or 202 (async, poll IMPORT_STATUS)
{ "jobId": "job_123", "totalRows": 300, "imported": 274, "duplicates": 14, "invalid": 12 }
```

### `GET /contacts/bulk-import/:jobId` — poll async import status
### `PUT /contacts/:id` / `DELETE /contacts/:id` / `POST /contacts/bulk-delete`
### `GET /contacts/groups` / `POST /contacts/groups` / `PUT|DELETE /contacts/groups/:id`

---

## 7. Credit Management

### Wallet object
```json
{ "balance": 12480, "status": "active", "lowCreditThreshold": 1000 }
```

### Credit history entry
```json
{
  "id": "CR-1006",
  "type": "credit",             // credit | debit
  "amount": 5000,
  "method": "UPI",              // UPI | Bank Transfer | Credit Card | Campaign Usage | Manual Adjustment
  "reference": "TXN10293",
  "balanceAfter": 12480,
  "date": "2026-08-12T10:20:00Z"
}
```

### `GET /credits/wallet`
### `GET /credits/history?page=&limit=&type=`
### `POST /credits/add`
```json
{ "amount": 5000, "method": "UPI", "reference": "TXN10293" }
```
### `POST /credits/transfer` — Reseller → Client credit distribution
```json
{ "toTenantId": "tenant_client_9", "amount": 1000 }
```
### `GET /credits/pricing` — per-message cost table by message type

**Business rule:** if a tenant sends spam/abusive/personal messages
(flagged manually or via reports), set `wallet.status = "suspended"`.
All subsequent `POST /campaigns` calls must then fail with
`403 { code: "CREDIT_SUSPENDED" }` until reactivated.

---

## 8. Media

### `POST /media/presign`
Returns a pre-signed URL so large video files upload directly to
S3-compatible storage rather than through the Node server.
```json
// Request
{ "fileName": "promo.mp4", "fileType": "video/mp4" }
// Response
{ "uploadUrl": "https://s3.../presigned", "fileUrl": "https://cdn.../promo.mp4" }
```

### `DELETE /media/:id`

---

## 9. Notifications

### `GET /notifications?unreadOnly=true`
```json
[
  { "id": "n1", "type": "campaign_completed", "title": "...", "read": false, "createdAt": "..." }
]
```
Event types: `campaign_started`, `campaign_completed`, `low_credit`,
`login_alert`, `system`.

### `POST /notifications/:id/read` / `POST /notifications/read-all`

---

## 10. Operating Rules to Enforce Server-Side

These are business rules referenced in the UI copy — the backend is the
source of truth for enforcing them, not just the frontend:

1. **Processing window:** campaigns only send between **10:00 AM–6:00 PM,
   working days**. Anything queued outside this window waits for the next
   valid window.
2. **Media limits:** image ≤ 5MB, video ≤ 30MB, PDF ≤ 5MB. Reject larger
   uploads with `413`.
3. **Abuse policy:** spam, abusive, or personal-message campaigns can
   trigger a credit suspension (`wallet.status = "suspended"`), which
   blocks all new campaign creation until support lifts it.
4. **Credit deduction:** debited at campaign creation (not on final
   delivery), based on `totalContacts × per-message rate` from
   `GET /credits/pricing`.

---

## 11. Suggested Stack Mapping (per original requirements doc)

| Layer | Choice |
|---|---|
| Frontend | React.js + MUI + Tailwind (this repo) |
| Backend | Node.js (Express/NestJS) |
| Database | PostgreSQL |
| Cache | Redis |
| Queue | RabbitMQ (campaign send queue) |
| Media storage | AWS S3-compatible |
| Deployment | Docker on Ubuntu Linux |
| Architecture | Multi-tenant SaaS, REST API |
