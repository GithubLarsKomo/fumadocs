# Knowledge Portal

Fumadocs-based read-only delivery layer for governed knowledge sources.

The portal is intentionally not a Source of Truth. Google Drive remains authoritative for Drive-owned source documents; promoted knowledge remains in its owning canonical repository/Child Brain; Adaptive Brain/Neo4j remains a derived retrieval layer.

Architecture:

- [Customization Architecture v1](docs/CUSTOMIZATION-ARCHITECTURE-v1.md)
- [Customization Architecture v2](docs/CUSTOMIZATION-ARCHITECTURE-v2.md)

## Runtime configuration

### Google Drive

Required:

- `GOOGLE_DRIVE_FOLDER_ID`
- `GOOGLE_SERVICE_ACCOUNT_JSON_B64`

Optional for Shared Drives:

- `GOOGLE_SHARED_DRIVE_ID`

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

The allowlist is comma-separated and fail-closed. An empty allowlist enables no Git-backed Brain.

The federation registry remains authoritative for Brain repository, default branch and `projectMemoryRoot`. The portal does not maintain a parallel repository map.

### Other portal sources

- `KNOWLEDGE_PORTAL_BRAINS_JSON` — optional JSON array for non-federated sidebar sources such as Drive or future provider-backed views.
- `BRAIN_GRAPH_SEARCH_URL` — bounded server-side HTTP search facade for Adaptive Brain/Neo4j results. This must not be a Bolt endpoint or unrestricted Cypher API.
- `BRAIN_GRAPH_SEARCH_TOKEN` — optional bearer token for the graph search facade; server-side only.

All provider credentials and tokens must remain server-side and must never be committed.

## Local / container behavior

The portal redirects `/` to `/drive`.

Available routes include:

- `/drive` — Google Drive evidence/source documents;
- `/brains/<brainId>` — allowlisted canonical Child Brain Project-Memory;
- `/api/health`;
- `/api/search` — combined Drive + enabled Child Brain + optional Adaptive Brain search.

If federation or one Child Brain search source fails, the remaining search sources continue to work. Adaptive Brain failure never disables canonical/evidence search.

## Architecture boundary

Portal-specific federation routing, navigation, status badges, branding, search composition and deployment configuration belong in `apps/knowledge-portal`.

The portal reads Child Brains and federation metadata only. It never writes canonical knowledge.

Generic provider functionality such as `packages/google-drive` remains isolated so it can be maintained or proposed upstream independently.
