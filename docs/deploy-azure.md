# Deploy to Azure Blob Storage (static website)

The deployable site lives in **`site/`** (index.html, app.js, data.js, styles.css,
manifest.json, sw.js, icons/). The `tools/` subfolder is dev-only and is excluded
from deploys. Deploys are automated with a GitHub Action; manual upload is a fallback.

## 1. One-time Azure setup

1. In the [Azure Portal](https://portal.azure.com), open your storage account
   (or create one: *Storage accounts → + Create*; any tier works, Standard LRS is cheapest).
2. Go to **Data management → Static website** → set **Enabled = Enabled**.
3. **Index document name**: `index.html` (default — leave it).
4. Error document path: leave blank.
5. Save. The portal shows a **primary endpoint**, e.g.
   `https://yourstorage.z13.web.core.windows.net/` — this URL is HTTPS by default,
   which is required for the service worker to work.

Enabling static website creates an empty `$web` container.

## 2. Automated deploy (GitHub Action)

A workflow at `.github/workflows/deploy-azure.yml` uploads `site/` to `$web`
**whenever a PR is merged into `master` or `develop`** (it also has a manual
"Run workflow" button in the Actions tab).

Wire up the repo settings first:

| Setting | Where | Value |
|---|---|---|
| **Repository secret** `AZURE_CREDENTIALS` | Settings → Secrets → Actions | Service-principal JSON (see below) |
| **Repository variable** `AZURE_STORAGE_ACCOUNT` | Settings → Variables → Actions | your storage account name, e.g. `yourstorage` |

Create the service principal (one time) and grant it upload rights:

```bash
az ad sp create-for-rbac --name "pronoun-trainer-gh" \
  --role "Storage Blob Data Contributor" \
  --scopes /subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.Storage/storageAccounts/yourstorage \
  --sdk-auth
```

The JSON printed by `--sdk-auth` is exactly the value of the `AZURE_CREDENTIALS`
secret (it already contains `clientId`, `clientSecret`, `subscriptionId`, `tenantId`).
If the role was granted before the workflow first runs, you may need to wait a
few minutes for RBAC propagation.

The action uploads `site/` with `--exclude-pattern 'tools/*'` so dev tooling
never reaches the blob, then verifies the live endpoint returns HTTP 200.

## 3. Manual upload (fallback)

### Option A — Azure CLI (recommended)

```bash
az login                          # once
az storage blob upload-batch --account-name yourstorage --destination '$web' --source site --exclude-pattern 'tools/*'
```

### Option B — AzCopy (fast sync; use for repeat deploys)

```bash
azcopy sync "site" "https://yourstorage.z13.blob.core.windows.net/\$web" --recursive --exclude-pattern 'tools/*'
```

Add `--delete-destination=true` to remove files that no longer exist locally.

### Option C — Portal drag-and-drop

In the storage account, open **Containers → $web**, then *Upload* and select the
contents of `site/` excluding `tools/` (keep the `icons/` subfolder structure).

## 4. Verify

1. Open the endpoint URL from step 1 in Chrome/Edge — the app should load with
   the 2×2 menu.
2. Load it again while offline (DevTools → Network → Offline) — it should still
   work, because the service worker caches everything on first visit.
3. On an iPhone/iPad: **Add to Home Screen** → installs as a standalone app
   (the manifest + icons are already wired up).

## Notes

- **MIME types**: Azure sets `Content-Type` from the file extension automatically
  (`.html`, `.js`, `.css`, `.json`, `.png`). No action needed.
- **Service worker**: served over HTTPS, same origin as the page — registers
  automatically. The cache name is `pronoun-trainer-v1`; on future updates just
  redeploy and reload (the SW re-caches changed files on update).
- **Custom domain / HTTPS**: the `*.web.core.windows.net` endpoint is HTTPS out of
  the box. For a custom domain you'd put Azure Front Door in front; not required now.
