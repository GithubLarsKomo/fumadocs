# Knowledge Portal Customization Architecture v6

Status: implementation baseline  
Date: 2026-09-30  
Scope: `apps/knowledge-portal`

## Goal

Turn the read-only federation portal into a more useful working surface without creating a second Source of Truth.

v6 adds five user-facing capabilities:

1. faceted knowledge search;
2. related knowledge and bounded backlinks;
3. source-health visibility;
4. inline Evidence viewing for safe preview formats;
5. browser-local recent items and favorites.

The authority model remains unchanged:

```text
Child Brain / Skillz -> canonical
Drive roots          -> evidence / source
Adaptive Brain       -> derived retrieval
Fumadocs             -> read-only delivery and navigation
localStorage         -> personal convenience state only
```

## Faceted search

The existing `/api/search` endpoint now enriches results with:

- `sourceClass`: `canonical | evidence | derived`;
- `sourceId`;
- `sourceLabel`.

Optional query parameters:

- `sourceClass`;
- `sourceId`;
- `limit`.

`/search` provides the interactive workbench.

The normal Fumadocs search dialog remains compatible with the enriched response. Search filters only change discovery; they never change authority.

## Related knowledge and backlinks

Canonical Brain pages show a bounded related-knowledge section.

Two relation types are distinguished:

- **Backlink** — another page in the same canonical Brain contains an actual portal link to the current page;
- **Related** — a bounded same-source search result or optional Adaptive-Brain result.

Backlink discovery deliberately scans only a bounded number of pages in the current Brain. It is a convenience relation, not a canonical graph assertion.

Drive pages use same-source relevance plus optional derived graph results. No relationship is promoted automatically.

## Source Health

`/status` and `/api/health` expose a human-readable and machine-readable source report.

The report distinguishes:

- healthy;
- empty;
- configured;
- disabled;
- unavailable.

An empty source is not treated as a source failure.

The dashboard reads source state only. It does not mutate or repair any upstream system.

### Versioned diagnostic JSON export

`/api/health/export` returns the current health report as a downloadable diagnostic document.

The export contract includes:

- `schema = ratzeburg-ai-brain/source-health`;
- semantic `schemaVersion`;
- ISO-8601 `generatedAt`;
- portal product and release;
- optional build revision when a supported non-secret commit environment variable is available;
- the sanitized source-health report.

The download filename contains both schema version and generation timestamp. Runtime credentials, provider tokens, service-account payloads and Drive folder IDs are deliberately excluded.

## Evidence Viewer

Supported Drive Evidence can be viewed inline:

- PDF;
- PNG;
- JPEG;
- WebP.

The browser never receives the Google service-account credential.

The preview route first resolves the requested Drive file ID through the already allowlisted portal source tree. Only a file that is already projected by an approved Drive root may be proxied. The proxy then requests the original binary server-side using the existing read-only Drive credential.

Unsupported Evidence types remain linked to their authoritative Drive original.

## Recent and Favorites

Recent items and Favorites are stored only in browser `localStorage`.

Properties:

- no new backend database;
- no canonical write;
- no synchronization between devices;
- no effect on search ranking or knowledge authority.

The home page displays a personal working-context section when local history exists.

## Security / governance

v6 does not widen source access.

- GitHub remains read-only.
- Drive remains read-only.
- the binary preview proxy cannot fetch arbitrary service-account-visible IDs outside the configured Drive projection;
- Adaptive Brain remains derived and optional;
- browser personalization is non-authoritative convenience state;
- no v6 interaction promotes knowledge automatically.

## Routes

- `/` — branded Knowledge Portal home;
- `/search` — faceted Knowledge Search;
- `/status` — Source Health dashboard;
- `/drive/**` — Drive Evidence;
- `/brains/<brainId>/**` — canonical Child Brain;
- `/api/search` — combined faceted search API;
- `/api/health` — detailed source-health API;
- `/api/drive/files/<fileId>` — allowlisted Evidence preview proxy.

## Acceptance criteria

- search can filter by authority class and source;
- the standard search dialog still functions;
- canonical pages expose bounded backlinks/related items;
- health status differentiates empty from unavailable sources;
- image/PDF Drive Evidence can render inline without exposing Drive credentials;
- arbitrary non-projected Drive IDs cannot be previewed;
- favorites and recent items are browser-local only;
- no canonical or Evidence source receives portal writes;
- production build, unit tests, formatting, TypeScript and ESLint pass.
