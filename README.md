# Infyle WA — WhatsApp Campaign Console (Frontend Demo)

A React + MUI + Tailwind frontend for a WhatsApp broadcast campaign SaaS.
Fully functional against a **mock API** (backed by `localStorage`) so it
can be demoed today, and structured so a real backend can be dropped in
later with minimal changes.

## Stack

- React 19 + Vite
- MUI (Material UI) — components & theming
- Tailwind CSS v4 — utility classes alongside MUI
- React Router — routing
- Axios — HTTP client with request/response interceptors
- Papaparse / SheetJS (xlsx) — client-side CSV/Excel parsing for previews
- Recharts — dashboard charts
- dayjs — dates

## Getting started

```bash
npm install
npm run dev
```

Visit the printed local URL. Log in with the demo virtual number and OTP
shown on the login screen (click the chips to autofill):

- Virtual number: `+91 92345 00110`
- OTP: `123456`

## Pages

| Route | Page | Description |
|---|---|---|
| `/login` | Login | Virtual-number + OTP login, simulating WhatsApp Business API connection |
| `/dashboard` | Dashboard | Stat cards, performance chart, recent activity |
| `/send-via-wa` | Send via WA | Import contacts (CSV/Excel/PDF), write message, attach media, send/schedule/save draft |
| `/wa-history` | WA History | Table of all past campaigns with detail drawer |
| `/scheduled` | Scheduled | Upcoming scheduled campaigns — run now, reschedule, cancel |
| `/manage-users` | Manage Users | Contact directory — manual add + bulk import |
| `/credits` | Credit Management | Wallet balance, add credits, transaction history |

## Project structure

```
src/
  api/
    axiosInstance.js   # axios + interceptors (auth token, tenant header, refresh, error normalization)
    endpoints.js        # every backend route the app expects, in one place
    mockApi.js          # localStorage-backed mock backend used for this demo
  components/            # shared UI: StatCard, StatusChip, FileDropzone, ScheduleModal, ProtectedRoute
  context/                # AuthContext (login/session), ToastContext (snackbars)
  layouts/
    DashboardLayout.jsx  # sidebar + topbar shell
  pages/                  # one file per route
  theme/
    theme.js              # MUI theme (palette, typography, component overrides)
```

## Wiring up a real backend later

1. Build the backend to match `API_DOCUMENTATION.md` (endpoint shapes,
   status codes, business rules).
2. Set `VITE_API_BASE_URL` in a `.env` file to your API's base URL.
3. In each page, swap the `mockApi` import for calls through
   `axiosInstance` + the paths in `src/api/endpoints.js`. The response
   shapes already match, so most pages need no other changes.
4. Replace the demo OTP flow in `AuthContext.jsx` with real calls to
   `ENDPOINTS.AUTH.REQUEST_OTP` / `VERIFY_OTP`.

## Notes baked into the UI (per product requirements)

- Media limits: image ≤ 5MB, video ≤ 30MB, PDF ≤ 5MB.
- Campaigns are processed 10:00 AM–6:00 PM on working days.
- Spam/abusive/personal-message campaigns can suspend the credit wallet.
# wa-campaign_webapp
# wa_frontend
