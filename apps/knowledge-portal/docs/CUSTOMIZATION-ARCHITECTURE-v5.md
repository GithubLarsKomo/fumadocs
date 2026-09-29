# Knowledge Portal Customization Architecture v5

Status: implementation baseline  
Date: 2026-09-29  
Scope: `apps/knowledge-portal`

## Goal

Scale the Drive evidence/asset layer from one configured folder to multiple explicit, independently governed Drive roots while keeping the Child-Brain federation and authority model unchanged.

## Source topology

```text
                         Fumadocs
                            |
          +-----------------+------------------+
          |                 |                  |
          v                 v                  v
   Super Second Brain    Drive roots       Adaptive Brain
      federation          allowlist           Neo4j
          |                 |                  |
       all eligible     root A / B / C       derived
       Child Brains      recursively         retrieval
          |                 |                  |
          +-----------------+------------------+
                            |
                     unified search/view
```

## Drive allowlist configuration

Preferred configuration:

```text
KNOWLEDGE_PORTAL_DRIVE_ROOTS_JSON
```

The value is a JSON array. Every entry is an explicitly allowed Drive subtree.

Required per root:

- `id` — Google Drive folder ID;
- `label` — human-readable portal label.

Optional:

- `slug` — stable lower-case route slug; otherwise derived from the label;
- `description` — short navigation description;
- `driveId` or `sharedDriveId` — Shared Drive identifier for that root.

Example:

```json
[
  { "id": "<folder-id>", "label": "Skillz Projects" },
  { "id": "<folder-id>", "label": "Research", "slug": "research" },
  { "id": "<folder-id>", "label": "Writing" }
]
```

## Fail-closed rules

- If `KNOWLEDGE_PORTAL_DRIVE_ROOTS_JSON` is present, the legacy `GOOGLE_DRIVE_FOLDER_ID` is ignored.
- Malformed JSON, duplicate folder IDs, duplicate route slugs and invalid IDs fail configuration explicitly.
- No implicit My Drive/root-wide scan is introduced.
- A configured root does not make sibling or parent folders visible.
- The service account / deployment identity must independently have read access to every configured root.

Legacy single-root deployments continue to work through `GOOGLE_DRIVE_FOLDER_ID`.

## Routing

Multi-root mode namespaces each subtree below `/drive`:

```text
/drive/skillz-projects/...
/drive/research/...
/drive/writing/...
```

The Drive page tree contains all configured roots. The main Brain/source switcher keeps Drive as one evidence source beside all canonical Child Brains, avoiding a second competing top-level navigation system.

## Search

The existing combined search now queries the aggregate Drive source, so all allowed Drive roots participate together with:

- all enabled canonical Child Brains;
- optional Adaptive Brain search.

One inaccessible Drive root is isolated and skipped. It does not suppress other Drive roots or canonical Brain results.

A malformed Drive allowlist remains a configuration error; runtime source failure and configuration failure are deliberately different states.

## Authority

Multi-root aggregation changes discoverability only.

```text
Child Brain / Skillz -> canonical
Drive roots          -> source / evidence / asset
Neo4j                -> derived
Fumadocs             -> read-only delivery
```

No Drive item is promoted automatically into canonical Brain knowledge.

## Compatibility

- `GOOGLE_DRIVE_FOLDER_ID` remains supported for existing single-root deployments.
- `GOOGLE_SHARED_DRIVE_ID` remains a global Shared Drive fallback.
- Per-root Drive IDs override that fallback.
- Existing `/drive/<document>` routes are preserved in legacy single-root mode.
- v3/v4 Child-Brain routing and `KNOWLEDGE_PORTAL_BRAIN_ALLOWLIST=*` are unchanged.

## Acceptance criteria

- Multiple explicitly configured Drive folders are projected into one Fumadocs Drive tree.
- Each root has a stable label and route namespace.
- Duplicate roots/slugs fail closed.
- Legacy single-root configuration still works.
- Combined search covers all healthy Drive roots and all enabled Brains.
- One inaccessible Drive root does not break the other sources.
- No folder ID or provider credential is committed.
- The portal performs no Drive writes.
