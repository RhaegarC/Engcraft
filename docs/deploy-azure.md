# Deploy to Azure Blob Storage (static website)

The deployable export lives in **`dist/`** (a clean copy of `site/` without dev tooling).

## 1. Create / enable the storage account

1. In the [Azure Portal](https://portal.azure.com), open your storage account
   (or create one: *Storage accounts → + Create*; any tier works, Standard LRS is cheapest).
2. Go to **Data management → Static website** → set **Enabled = Enabled**.
3. **Index document name**: `index.html` (default — leave it).
4. Error document path: leave blank.
5. Save. The portal shows a **primary endpoint**, e.g.
   `https://yourstorage.z13.web.core.windows.net/` — this URL is HTTPS by default,
   which is required for the service worker to work.

Enabling static website creates an empty `$web` container.

## 2. Upload the `dist/` folder

### Option A — Azure CLI (recommended)

```bash
az login                       # once
az storage blob upload-batch --account-name yourstorage --destination '$web' --source dist
```

### Option B — AzCopy (fast sync; use for repeat deploys)

```bash
azcopy sync "dist" "https://yourstorage.z13.blob.core.windows.net/\$web" --recursive
```

Add `--delete-destination=true` to remove files that no longer exist locally.

### Option C — Portal drag-and-drop

In the storage account, open **Containers → $web**, then *Upload* and select the
contents of `dist/` (keep the `icons/` subfolder structure).

## 3. Verify

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
  re-upload `dist/` and reload (the SW re-caches changed files on update).
- **Custom domain / HTTPS**: the `*.web.core.windows.net` endpoint is HTTPS out of
  the box. For a custom domain you'd put Azure Front Door in front; not required now.
