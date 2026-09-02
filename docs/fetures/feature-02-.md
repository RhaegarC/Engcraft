# Feature 02 — Web Push Notifications

**Status:** Spec'd (from a `/grill-me` session) — not yet implemented.
**Depends on:** Feature 01 (workbox-window update banner) — merged.

## Goal

Give the PWA the ability to push a notification to users' devices after the app is installed. A user opts in with one button; an Azure Function broadcasts a message to all opted-in devices using the Web Push protocol. Scope is deliberately minimal: prove the end-to-end loop works (subscribe → store → send → notification on device) for testing.

## Background & constraints

- The PWA is a static, offline-first site with zero runtime dependencies ([NFR-4](../README.md)).
- Feature 01 added the workbox-window "new version available" banner (merged via PR #6).
- The app is used on iPhones/iPads in classrooms.
- **iOS constraint (shapes the feature):** Web Push on iOS only works for PWAs **installed to the Home Screen** (iOS 16.4+). It is unavailable in Safari/Chrome browser tabs on iOS. Android/desktop work everywhere. So push reaches classroom iPads only when the teacher installs the app and taps "Allow" — the feature is a progressive enhancement, not a guarantee.
- **Azure Function** [api/EngFun/](../api/EngFun/) was scaffolded as a .NET isolated-worker Functions v4 template (placeholder `Function1`).

## Key decisions (from the grilling session)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Trigger | **Manual / test send only.** No scheduler, no segmentation, no teacher portal. |
| 2 | Push delivery | `WebPush` NuGet package (direct Web Push, VAPID-signed). **Not** Azure Notification Hubs. |
| 3 | Subscription storage | Existing Azure Table **`learnstor` / `PushSubscriptions`**, reached via a dedicated `PushStorage` connection string. |
| 4 | Table schema | We define it (table assumed empty — see Assumptions). |
| 5 | API surface | `POST /api/subscribe` (Anonymous, idempotent upsert) · `POST /api/send` (Function key, broadcast). |
| 6 | VAPID keys | Generated once; **public** key in `site/push-config.js` (public by design), private key in Function app settings. |
| 7 | Client UX | One "🔔 Enable practice reminders" button on the menu screen (enabled / denied / unsupported states). |
| 8 | Local testing | `func start` + site on `localhost` + one-command send script. |
| 9 | Phone testing | Function **deployed to Azure**; site deployed to the blob origin; installed PWA. |
| 10 | Function runtime | **Retarget to `net8.0` isolated** (currently `net48`, which would force a Windows-only Function App). |
| 11 | Deploy | New `deploy-function.yml` workflow; existing site-deploy workflow unchanged. |

## Architecture

```
[ PWA site/ ]                                      [ Azure Function App — EngFun ]
                                                                 |
  menu button ──▶ push.js                                        |
    Notification.requestPermission()                              |
    pushManager.subscribe({ applicationServerKey: VAPID_PUB })   |
    fetch(apiBase + '/api/subscribe', {endpoint, keys}) ────────▶ POST /api/subscribe (Anonymous)
                                                                   └─▶ upsert → Table PushSubscriptions
                                                                        (learnstor)
  [sw.js]  push event ──▶ showNotification({title, body})  ◀── POST /api/send (Function key)
  [sw.js]  notificationclick ──▶ close · focus / open app        reads all rows → WebPush (VAPID)
```

## Data storage — `PushSubscriptions` (`learnstor`)

Table exists already; we define the entity shape. RowKey cannot contain `/`, so the push endpoint (a URL) is hashed.

| Property | Value |
|---|---|
| `PartitionKey` | `push` (single segment; segmentation out of scope) |
| `RowKey` | `SHA256(endpoint)` hex — upsert on the same key makes re-subscribes idempotent |
| `endpoint` | Push service endpoint URL from the subscription |
| `p256dh` | base64url public key (`subscription.keys.p256dh`) |
| `auth` | base64url auth secret (`subscription.keys.auth`) |
| `CreatedAt` | ISO 8601 UTC |

## API contract

### `POST /api/subscribe` — `AuthorizationLevel.Anonymous`

Request:
```json
{ "endpoint": "https://…", "keys": { "p256dh": "…", "auth": "…" } }
```
- Upserts into `PushSubscriptions`. Idempotent. Returns `200` (updated) / `201` (created).

### `POST /api/send` — `AuthorizationLevel.Function`

Request (optional; defaults if omitted):
```json
{ "title": "Egnlish Craft", "body": "Time to practice your pronouns! 🎯" }
```
- Reads all rows (loop with continuation token), sends the JSON payload to each via `WebPush` with the VAPID key.
- Response:
```json
{ "sent": 3, "failed": [ { "endpointHash": "…", "error": "…" } ] }
```

## Frontend changes — [site/](../site/)

- **[sw.js](../site/sw.js):** add `push` event → parse payload `{title, body}` → `registration.showNotification(title, { body, icon: '/icons/mc192.png', data: { url: '/' } })`. Add `notificationclick` → close the notification, focus the existing window or open `data.url`.
- **[site/push-config.js](../site/push-config.js) (new):** `window.PUSH_CONFIG = { vapidPublicKey, apiBase }`. `apiBase` defaults to `http://localhost:7071` for local runs; point it at the deployed Function URL for phone tests.
- **[site/push.js](../site/push.js) (new):** `enablePush()` — guard (service worker + `PushManager` available) → `Notification.requestPermission()` → `reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY) })` → `POST apiBase + '/api/subscribe'`. Also `getPushState()` → `enabled | denied | unsupported` for the button.
- **[site/index.html](../site/index.html):** a "🔔 Enable practice reminders" button in `#menu`; load `push-config.js` and `push.js`.
- **[site/styles.css](../site/styles.css):** style the button + its three states.

## Backend changes — [api/EngFun/](../api/EngFun/)

- **[EngFun.csproj](../api/EngFun/EngFun.csproj):** `<TargetFramework>net8.0</TargetFramework>` (was `net48`).
- Add packages: `WebPush`, `Azure.Data.Tables`.
- Replace placeholder `Function1.cs` with `SubscribeFunction.cs` and `SendFunction.cs` (HTTP triggers as above).
- **host.json:** add CORS for the site origin(s) — see Deployment.
- **local.settings.json** (gitignored — never committed): `PushStorage` = `learnstor` connection string (account key or SAS), `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` = `mailto:Rhaegar.Cheng@outlook.com`, `TABLE_NAME` = `PushSubscriptions`. Keep `AzureWebJobsStorage` = `UseDevelopmentStorage=true` locally so the runtime does not write bookkeeping artifacts into the real account.

## Deployment

### 1. Create the Function App (does not exist yet)

Windows or Linux, **Functions v4, .NET isolated (net8.0)**. Example CLI:

```bash
az functionapp create \
  --resource-group <rg> \
  --name <app> \
  --consumption-plan-location <loc> \
  --runtime dotnet-isolated --runtime-version 8.0 \
  --functions-version 4 \
  --os-type Windows \
  --storage-account <func-storage> \
  --app-insights <ai> --app-insights-key <key>
```

App settings to configure:
| Setting | Value |
|---|---|
| `PushStorage` | `learnstor` connection string (account key or SAS) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | generated keys |
| `VAPID_SUBJECT` | `mailto:Rhaegar.Cheng@outlook.com` |
| `TABLE_NAME` | `PushSubscriptions` |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | (Program.cs already wires App Insights) |

### 2. GitHub secrets / variables

| Name | Status | Note |
|---|---|---|
| `AZURE_CREDENTIALS` | exists | SPN needs "Website Contributor" on the Function App (or its Resource Group) — currently scoped for Blob only |
| `AZURE_FUNCTION_APP_NAME` | **add** | Function App name for the deploy workflow |
| `AZURE_STORAGE_ACCOUNT` | exists | static-site account (unchanged) |

### 3. `deploy-function.yml` (new workflow)

- Trigger: same as the site workflow — PR merged into `develop`/`master`, plus `workflow_dispatch`.
- Steps: `azure/login@v2` → `azure/functions-action@v1` (zip deploy) → set app settings via `az functionapp config appsettings set` → set CORS via `az functionapp cors add`.

### 4. CORS

The Function must allow the subscribe POST from the site origin. Add to CORS:
- `https://<account>.z*.web.core.windows.net` (blob static site), and
- `http://localhost:8000` (local testing).
(`*` is acceptable during testing.)

### 5. Site deploy

Unchanged — the existing `deploy-azure.yml` uploads all of `site/`. To test on a phone before merging, run it manually via `workflow_dispatch` against the feature branch.

## Testing

### Local (desktop)
1. `func start` in [api/EngFun/](../api/EngFun/) (needs `PushStorage` + VAPID values in `local.settings.json`).
2. Serve the site: `python -m http.server 8000` (or `npx serve site`). `localhost` is a secure context, so Web Push works.
3. Open `http://localhost:8000`, tap **🔔 Enable**, allow permission.
4. `node site/tools/send-push.mjs "Practice time!"` → notification appears.

### Phone — installed PWA (iOS)
1. Deploy the site from the feature branch (workflow_dispatch) so the push-enabled version is live at the stable origin.
2. Add the app to **Home Screen**, open it **from the icon** (standalone mode).
3. Tap **🔔 Enable** — the permission prompt only fires from a user gesture on an installed PWA (iOS 16.4+).
4. Send via the script → notification arrives on the phone.
5. If permission is stuck "denied": **Settings → Safari → Advanced → Website Data**, then re-prompt.

### `site/tools/send-push.mjs` (new)
- POSTs `{title, body}` to `apiBase + '/api/send'` with the Function host key; prints `sent`/`failed`.
- Get the host key: `az functionapp keys list -n <app> -g <rg> --query primaryHostKey`.

## Out of scope (v1)

- Scheduled/timer reminders; per-user targeting or segmentation.
- Teacher portal / UI for composing messages (send is an endpoint + script for now).
- Azure Notification Hubs.
- Un-subscribe endpoint (browser handles unsubscribe via `pushManager`; stale subscriptions just fail the send and are skipped).
- iOS install/onboarding guide; message localisation.

## Assumptions / open questions

- **`PushSubscriptions` is empty** → we define the entity shape. If it already has rows/columns, adapt the property names before implementing.
- iOS reachability is limited by design (installed-PWA only); the feature remains useful on Android/desktop and on installed iOS PWAs.
- Stale subscriptions (expired push endpoints) surface as `failed` entries in the send response; v1 records them but does not purge the table.
