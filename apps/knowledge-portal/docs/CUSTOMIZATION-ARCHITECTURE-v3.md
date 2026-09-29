# Knowledge Portal Customization Architecture v3

Status: implementation baseline  
Date: 2026-09-29  
Scope: `apps/knowledge-portal`

## Goal

Turn the functional v2 knowledge portal into a scalable reading and navigation experience that remains usable when the federation grows from a few sources to all registered Child Brains.

## UX hierarchy

The portal now separates two navigation levels:

1. **Brain selection** — one compact switcher at the top of the sidebar.
2. **Document navigation** — the Fumadocs page tree for the active Brain.

This prevents the source list from competing visually with the active Brain's document tree.

## Brain switcher

The switcher:

- shows only the active Brain until opened;
- uses a scrollable menu for large federations;
- truncates long active descriptions;
- limits menu descriptions to two lines;
- shows authority as a small status dot rather than a dominant badge;
- is reused unchanged for Drive, selected Brain allowlists and all-Brain mode.

## Document header

Git-backed Brain pages use a portal-specific header:

- Knowledge Portal / Brain / section context path;
- canonical document H1 promoted into the portal header;
- optional Brain/page description;
- compact provenance line;
- source-link and copy-link actions.

The source Markdown's leading H1 is removed from the rendered body after promotion so the page does not show duplicate titles.

## Reading surface

The v3 reading surface:

- uses Hanken Grotesk when available with a safe system fallback;
- caps prose width near 76 characters;
- increases heading rhythm and body line height;
- keeps technical inline code visually distinct;
- removes code-chip styling from linked Markdown filenames;
- marks in-portal Brain document links with a subtle directional affordance.

## Sidebar

Desktop sidebar width is increased to approximately 308 px to improve document-tree readability without allowing Brain descriptions to dominate the page.

The footer keeps the authority reminder concise:

`Read-only Portal · Quellenautorität bleibt erhalten`

## All-Brain mode

The federation remains fail-closed by default.

Selected mode:

```text
KNOWLEDGE_PORTAL_BRAIN_ALLOWLIST=coding,leadership,regulatory-compliance
```

Explicit all-Brain mode:

```text
KNOWLEDGE_PORTAL_BRAIN_ALLOWLIST=*
```

`*` means all registry entries that satisfy the existing eligibility gates:

- `status === available`;
- repository available;
- memory root available.

The registry remains authoritative. The portal still does not maintain a parallel repository list.

## Search scaling

All-Brain mode can involve many private repositories. Canonical Brain search therefore no longer initializes every source concurrently.

Default:

```text
KNOWLEDGE_PORTAL_BRAIN_SEARCH_CONCURRENCY=4
```

The value is bounded to `1..12`.

Per-Brain search failures remain isolated.

## Security and authority

v3 does not change the authority model:

- Child Brain Project Memory remains canonical for its registered scope;
- Drive remains evidence/source content where configured;
- Adaptive Brain remains derived;
- the portal is read-only;
- `*` is an explicit deployment opt-in, not a default;
- no GitHub token or graph credential is emitted to the browser.

## Acceptance criteria

- Active Brain is visible without rendering all Brains as cards.
- 20+ Brains remain navigable in a bounded switcher.
- Active Brain document tree remains visible and primary.
- Leading Markdown H1 is rendered once.
- Provenance remains visible but secondary to content.
- Source and copy-link actions are available.
- Internal Markdown document links read as document links, not code buttons.
- Mobile switcher remains reachable inside the sidebar drawer.
- All-Brain mode requires explicit `*`.
- Canonical search initialization is concurrency-bounded.
- Production build, unit tests, formatting, TypeScript checks and lint pass.
