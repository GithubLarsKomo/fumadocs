# Knowledge Portal

Fumadocs-based read-only delivery layer for governed knowledge sources.

The portal is intentionally not a Source of Truth. Google Drive remains authoritative for Drive-owned source documents; promoted knowledge remains in its owning canonical repository/Child Brain; Adaptive Brain/Neo4j remains a derived retrieval layer.

See [Customization Architecture v1](docs/CUSTOMIZATION-ARCHITECTURE-v1.md).

## Runtime configuration

Required for Google Drive:

- `GOOGLE_DRIVE_FOLDER_ID`
- `GOOGLE_SERVICE_ACCOUNT_JSON_B64`

Optional for Shared Drives:

- `GOOGLE_SHARED_DRIVE_ID`

Optional portal customization:

- `KNOWLEDGE_PORTAL_BRAINS_JSON` — JSON array for the sidebar source/Brain switcher. Do not store secrets or private deployment metadata in this value when its labels/URLs would be rendered to users.
- `BRAIN_GRAPH_SEARCH_URL` — bounded server-side HTTP search facade for Adaptive Brain/Neo4j results. This must not be a Bolt endpoint or unrestricted Cypher API.
- `BRAIN_GRAPH_SEARCH_TOKEN` — optional bearer token for the graph search facade; server-side only.

The Google service-account JSON and graph token must never be committed.

## Local / container behavior

The portal redirects `/` to `/drive`, renders Drive-backed pages, exposes `/api/health`, and provides combined portal search at `/api/search`.

Drive search works without Adaptive Brain configuration. If the optional graph search channel is unavailable or fails, the search route falls back to Drive results.

## Architecture boundary

Portal-specific navigation, status badges, branding, search composition, federation semantics and deployment configuration belong in `apps/knowledge-portal`.

Generic content-source functionality such as `packages/google-drive` remains isolated so it can be maintained or proposed upstream independently.
