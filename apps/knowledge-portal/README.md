# Knowledge Portal

Minimal Phase 1 Fumadocs portal for the read-only Google Drive source.

## Runtime configuration

Required:

- `GOOGLE_DRIVE_FOLDER_ID`
- `GOOGLE_SERVICE_ACCOUNT_JSON_B64`

Optional for Shared Drives:

- `GOOGLE_SHARED_DRIVE_ID`

The service-account JSON must be base64 encoded and supplied only as a server-side secret. Never commit it.

## Local / container behavior

The portal redirects `/` to `/drive`, renders Drive-backed pages, and exposes `/api/health`.

Drive remains authoritative for Drive-owned source documents. No Drive-to-Git promotion is performed by this application.
