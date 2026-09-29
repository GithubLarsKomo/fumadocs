# Knowledge Portal Customization Architecture v4

Status: implementation baseline  
Date: 2026-09-29  
Scope: `apps/knowledge-portal` + `packages/google-drive`

## Goal

Make the configured Google Drive folder the explicit connected **evidence and asset layer** of the Knowledge Portal, while preserving the existing Source-of-Truth boundaries.

The portal treats important human-facing binary and visual artifacts as first-class Drive-backed navigation items instead of leaving them outside the portal.

## Storage boundary

| Content class | Authoritative owner | Portal behavior |
| --- | --- | --- |
| Project/domain knowledge | owning GitHub Child Brain | render as canonical read-only pages |
| Workflow/governance contracts | Skillz | render/project as canonical framework knowledge |
| Executable code, tests, CI and schemas | producer repository | remain in source control |
| Important figures, images, PDFs, decks, sheets and human-facing binary assets | connected Google Drive folder | expose as Drive evidence/asset pages linking to the original |
| Controlled external records | controlled source system | retain original there; reference only where appropriate |
| Adaptive ranking/candidates | Neo4j runtime | derived retrieval only |
| Portal UI | Fumadocs Knowledge Portal | read-only delivery layer |

## Connected Drive root

The deployment selects exactly one connected root through `GOOGLE_DRIVE_FOLDER_ID`. The folder ID stays in deployment configuration and is not hard-coded into the repository.

Recommended additive convention:

```text
<connected Drive root>/
├── Assets/
│   ├── architecture diagrams
│   ├── important figures
│   ├── approved images
│   └── other human-facing binary artifacts
└── existing Drive-owned source/evidence documents
```

Existing Drive documents do not need to be migrated merely to satisfy this convention.

## Important-artifact rule

Put an artifact in the connected Drive folder when it is important for understanding, review, communication or delivery; is human-facing rather than a build/runtime dependency; has a Drive-owned lifecycle; and should be visible in Fumadocs.

Typical examples include architecture figures, approved images, PDFs, decks, spreadsheets, DOCX deliverables and review/evidence files.

Do **not** move repository-native code, schemas, tests, CI files or runtime assets to Drive merely because they are binary or because Fumadocs should display them.

## Drive adapter behavior

The read-only Google Drive DynamicSource recursively projects the connected folder.

- Google Docs -> Markdown.
- Markdown / text -> native portal content.
- PDF/DOCX/XLSX/PPTX/Google Sheets/Google Slides -> evidence page + Drive link.
- PNG/JPEG/WebP/SVG -> visual evidence page + Drive link.

Every page retains Drive provenance. The adapter performs no Drive writes and no automatic promotion into Git-backed canonical knowledge.

## Architecture example

The Adaptive Brain overview figure is stored as `Assets/adaptive-brain-system-overview.png` inside the connected Drive root.

Its normative architectural meaning remains in the canonical Skillz/Second-Brain contracts. The image is a presentation artifact; Fumadocs exposes it as Drive evidence.

## Authority model

```text
GitHub Child Brain / Skillz -> canonical
Google Drive               -> source / evidence / asset
Adaptive Brain / Neo4j     -> derived
Fumadocs                   -> read-only view
```

Search ranking does not alter these authority classes.

## Acceptance criteria

- The connected Drive root remains the only configured Drive source boundary.
- Important binary/visual artifacts can be stored under `Assets/`.
- PNG/JPEG/WebP/SVG items appear in the Drive-backed Fumadocs tree as evidence pages.
- Evidence pages link to the authoritative Drive original when a `webViewLink` is available.
- Child Brain and Skillz knowledge remains canonical and is not duplicated into Drive.
- The portal performs no Drive writes.
- No provider credential or Drive folder ID is committed.
- Existing v3 Brain navigation/search behavior remains unchanged.
- Google Drive package tests cover image classification.
