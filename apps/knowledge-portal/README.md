# Knowledge Portal

Fumadocs-based read-only delivery layer for governed knowledge sources.

The portal is intentionally not a Source of Truth. Google Drive remains authoritative for Drive-owned source documents; promoted knowledge remains in its owning canonical repository/Child Brain; Adaptive Brain/Neo4j remains a derived retrieval layer.

Architecture:

- [Customization Architecture v1](docs/CUSTOMIZATION-ARCHITECTURE-v1.md)
- [Customization Architecture v2](docs/CUSTOMIZATION-ARCHITECTURE-v2.md)
- [Customization Architecture v3](docs/CUSTOMIZATION-ARCHITECTURE-v3.md)
- [Customization Architecture v4](docs/CUSTOMIZATION-ARCHITECTURE-v4.md)
- [Customization Architecture v5](docs/CUSTOMIZATION-ARCHITECTURE-v5.md)
- [Customization Architecture v6](docs/CUSTOMIZATION-ARCHITECTURE-v6.md)

## Runtime configuration

### Google Drive

Required:

- `GOOGLE_SERVICE_ACCOUNT_JSON_B64`
- one Drive root configuration:
  - preferred multi-root mode: `KNOWLEDGE_PORTAL_DRIVE_ROOTS_JSON`
  - legacy single-root mode: `GOOGLE_DRIVE_FOLDER_ID`

Preferred multi-root example:

```json
[
  { "id": "<folder-id>", "label": "Skillz Projects" },
  { "id": "<folder-id>", "label": "Research", "slug": "research" },
  { "id": "<folder-id>", "label": "Writing", "description": "Approved writing assets" }
]
```

Each configured root is an explicit allowlisted subtree and is read recursively. When `KNOWLEDGE_PORTAL_DRIVE_ROOTS_JSON` is present, it fully replaces the legacy `GOOGLE_DRIVE_FOLDER_ID` path; invalid JSON fails closed instead of silently widening access.

Optional for Shared Drives:

- global fallback: `GOOGLE_SHARED_DRIVE_ID`
- per root: `driveId` (or `sharedDriveId`) inside the JSON item

The deployment identity must have read access to every configured folder. Important human-facing binary or visual artifacts that are not repository-native build/runtime assets belong in one of these connected roots, preferably under `Assets/`. The portal remains read-only: creation/versioning happens in Drive, while Fumadocs discovers and links the authoritative Drive item.

### Git-backed Child Brains

Required to enable canonical Child Brain routes:

- `KNOWLEDGE_PORTAL_FEDERATION_REPOSITORY`
- `KNOWLEDGE_PORTAL_BRAIN_ALLOWLIST`

Recommended for private repositories:

- `KNOWLEDGE_PORTAL_GITHUB_TOKEN`

Optional:

- `KNOWLEDGE_PORTAL_FEDERATION_REF` — default `main`
- `KNOWLEDGE_PORTAL_FEDERATION_REGISTRY_PATH` — default `docs/super-memory/registry.json`
- `KNOWLEDGE_PORTAL_GITHUB_API_URL` — default `https://api.github.com`
- `KNOWLEDGE_PORTAL_BRAIN_SEARCH_CONCURRENCY` — concurrent canonical Brain search/index workers; default `4`, bounded to `1..12`

The allowlist is fail-closed. Use a comma-separated list for selected Brains. Set `KNOWLEDGE_PORTAL_BRAIN_ALLOWLIST=*` only when the deployment should expose every registry Brain whose status is `available`. An empty allowlist enables no Git-backed Brain.

The federation registry remains authoritative for Brain repository, default branch and `projectMemoryRoot`. The portal does not maintain a parallel repository map.

### Other portal sources

- `KNOWLEDGE_PORTAL_BRAINS_JSON` — optional JSON array for non-federated sidebar sources such as Drive or future provider-backed views.
- `BRAIN_GRAPH_SEARCH_URL` — bounded server-side HTTP search facade for Adaptive Brain/Neo4j results. This must not be a Bolt endpoint or unrestricted Cypher API.
- `BRAIN_GRAPH_SEARCH_TOKEN` — optional bearer token for the graph search facade; server-side only.

All provider credentials and tokens must remain server-side and must never be committed.

## Local / container behavior

The portal exposes a branded home dashboard at `/`.

Available routes include:

- `/` — branded Knowledge Portal home;
- `/search` — faceted search across authority classes and sources;
- `/status` — source-health dashboard;
- `/drive` — Google Drive evidence/source documents;
- `/brains/<brainId>` — allowlisted canonical Child Brain Project-Memory;
- `/api/health` — detailed source health;
- `/api/health/export` — versioned and timestamped diagnostic JSON download;
- `/api/search` — combined Drive + enabled Child Brain + optional Adaptive Brain search;
- `/api/drive/files/<fileId>` — allowlisted inline Evidence preview for supported binary formats.

If federation or one Child Brain search source fails, the remaining search sources continue to work. Adaptive Brain failure never disables canonical/evidence search.

## Architecture boundary

Portal-specific federation routing, navigation, status badges, branding, search composition and deployment configuration belong in `apps/knowledge-portal`.

The portal reads Child Brains and federation metadata only. It never writes canonical knowledge.

Generic provider functionality such as `packages/google-drive` remains isolated so it can be maintained or proposed upstream independently.
