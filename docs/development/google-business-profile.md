# Google Business Profile — Cloud & OAuth Setup

Operator setup for **GBP Read Integration** (`GBP_READ_INTEGRATION_VERSION = 1`).

Operating doc: [`../growth/gbp-api-integration.md`](../growth/gbp-api-integration.md)  
API research: [`../research/google-business-profile-api-2026.md`](../research/google-business-profile-api-2026.md)

## Intent

READ-ONLY sync into Local Growth. Scope requested can authorize writes; **app code must not call write methods**.

## A. Project access

1. Create or select a Google Cloud project.
2. Complete Business Profile APIs **Prerequisites** and obtain **project approval** for GBP API access.
3. If Performance API shows **quota 0** after enable → **request GBP API access** (required for metrics sync).

## B. Enable APIs

Minimum for Sprint 12.1:

| API | Host / role |
|---|---|
| My Business Account Management API | List accounts |
| My Business Business Information API | Locations + profile fields |
| Business Profile Performance API | Daily metrics + monthly keywords |
| Google My Business API | v4 reviews list (aggregates only in app) |

Optional (official eight; not required for V1): Lodging, Place Actions, Notifications, Verifications, Q&A.

## C. OAuth consent + client

1. Configure OAuth consent screen (app name, privacy/ToS links as applicable).
2. Create **OAuth client ID** → type **Web application**.
3. Authorized redirect URIs:
   - **Production:** `{NEXT_PUBLIC_SITE_URL}/api/gbp/oauth/callback`
   - **Local:** `http://localhost:3000/api/gbp/oauth/callback`
4. Scope to request: `https://www.googleapis.com/auth/business.manage`  
   Do **not** request deprecated `plus.business.manage` for new apps.
5. Prefer offline access (refresh token) for sync without an interactive session each time.

## D. Environment variables

Server-only (never `NEXT_PUBLIC_`):

| Variable | Purpose |
|---|---|
| `GOOGLE_GBP_CLIENT_ID` | OAuth web client ID |
| `GOOGLE_GBP_CLIENT_SECRET` | OAuth client secret |
| `GOOGLE_GBP_REDIRECT_URI` | Optional explicit redirect; defaults to `NEXT_PUBLIC_SITE_URL` + `/api/gbp/oauth/callback` |
| `GOOGLE_GBP_TOKEN_ENCRYPTION_KEY` | Optional AES-GCM key (64-char hex or passphrase). Falls back to key derived from `REPORTS_SESSION_SECRET` |
| `GROWTH_TEST_MOCK_GBP=1` | Acceptance/E2E mock provider — live Google = 0 |

Do not put Places API keys on this OAuth client.

## E. Deploy checklist

- [ ] Redirect URI matches deployed `NEXT_PUBLIC_SITE_URL`
- [ ] Env vars set on Vercel (or host) for Production / Preview as needed
- [ ] Migration applied: `20260825120000_growth_sprint12_1_gbp_read`
- [ ] Smoke: Connect → select location → Sync Profile → Sync Performance on `/reports/growth/local`

## F. Workspace note

If using Google Workspace: ensure Google Business Profile is enabled for the org (else `403 PERMISSION DENIED`).

## G. Product guardrails

- Method allowlist READ-ONLY in app
- Sync only on explicit operator actions (no dashboard-load API)
- Persist review aggregates only — no review text / reviewer PII
- Places API remains a separate product path
