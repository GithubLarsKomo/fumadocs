# Knowledge Portal Customization Architecture v2

Status: implementation baseline  
Date: 2026-09-29  
Scope: `apps/knowledge-portal`

## Goal

Extend the v1 portal customization layer with real Git-backed Child Brain content while preserving the existing federation and Source-of-Truth model.

v2 adds:

- read-only GitHub Child Brain projection;
- federation-registry-driven source discovery;
- explicit Brain allowlisting;
- real `/brains/<brainId>` Fumadocs routes;
- canonical source-status rendering;
- combined Drive + Child Brain + optional Adaptive Brain search.

## Ownership model

The portal does not define Brain ownership itself.

The authoritative routing chain is:

```text
Super Second Brain registry
        |
        | repository + defaultBranch + projectMemoryRoot
        v
GitHub Child Brain
        |
        | read-only projection
        v
Fumadocs Knowledge Portal
```

The portal consumes federation metadata; it does not maintain an independent repository map.

## Runtime configuration

Git-backed Child Brains are enabled only when both a federation repository and an explicit allowlist are configured.

Required to enable canonical Child Brain routes:

- `KNOWLEDGE_PORTAL_FEDERATION_REPOSITORY`
- `KNOWLEDGE_PORTAL_BRAIN_ALLOWLIST`

Recommended for private repositories:

- `KNOWLEDGE_PORTAL_GITHUB_TOKEN`

Optional:

- `KNOWLEDGE_PORTAL_FEDERATION_REF` — defaults to `main`
- `KNOWLEDGE_PORTAL_FEDERATION_REGISTRY_PATH` — defaults to `docs/super-memory/registry.json`
- `KNOWLEDGE_PORTAL_GITHUB_API_URL` — defaults to `https://api.github.com`

Example allowlist:

```text
coding,leadership,regulatory-compliance,neurodegeneration
```

An empty allowlist exposes no Git-backed Child Brains.

## Projection scope

For every enabled Brain, the portal reads the registered:

- `repository`
- `defaultBranch`
- `projectMemoryRoot`

The directory containing `projectMemoryRoot` becomes the Fumadocs source root.

This intentionally projects the governed Project-Memory layer rather than the whole producer repository.

Example:

```text
projectMemoryRoot:
docs/project-memory/INDEX.md

projected root:
docs/project-memory/
```

Markdown and MDX files below that root become read-only Fumadocs pages.

## Revision pinning

At source refresh time the adapter resolves the configured default branch to a concrete Git commit SHA.

Every page then carries:

- owning Brain ID;
- repository identity;
- source path;
- concrete source revision;
- canonical reference;
- canonical GitHub source URL.

The UI renders the source as `Canonical / GitHub Child Brain` and displays the pinned revision prefix.

The portal itself remains non-canonical.

## Routes

Each enabled Brain is exposed under:

```text
/brains/<brainId>
/brains/<brainId>/<slug...>
```

An `INDEX.md` maps to the directory index route.

Examples:

```text
docs/project-memory/INDEX.md
-> /brains/coding

docs/project-memory/knowledge/INDEX.md
-> /brains/coding/knowledge

docs/project-memory/knowledge/example.md
-> /brains/coding/knowledge/example
```

## Brain switcher

The sidebar switcher combines:

1. explicitly configured non-federated portal sources such as Drive;
2. allowlisted active Brains from the federation registry.

Federated Brain entries always use:

- route `/brains/<brainId>`;
- source class `canonical`;
- label and scope from the registry.

If federation discovery is unavailable, non-federated portal sources still render.

## Search

The v2 search pipeline is:

```text
Fumadocs SearchDialog
        |
        v
GET /api/search
        |
        +--> Drive search
        |
        +--> enabled GitHub Child Brain searches
        |
        +--> optional Adaptive Brain search facade
```

Search authority rules:

- Drive results remain evidence/source results.
- GitHub Child Brain results are canonical only because the owning Brain is canonical for that scope.
- Adaptive Brain / Neo4j results remain derived navigation context.
- Search ranking never changes authority.

Each Child Brain result is labeled with its Brain name in breadcrumbs.

## Failure behavior

The delivery layer is intentionally resilient:

- Federation navigation failure -> Drive/manual sources still render.
- One Child Brain search failure -> remaining sources still search.
- All Child Brain search failures -> Drive and optional graph search still work.
- Adaptive Brain search failure -> canonical/evidence search still works.
- A direct request to an unavailable or non-allowlisted Brain -> not found.

No fallback turns derived data into canonical content.

## Security boundary

- GitHub tokens stay server-side.
- The allowlist is fail-closed.
- The federation registry is read-only.
- Only registered available Brains with reachable memory roots are eligible.
- The portal does not write to Child Brain repositories.
- The portal does not write to the federation registry.
- No browser-side GitHub token is emitted.
- No browser-side Neo4j credential is emitted.
- No arbitrary Cypher is exposed.
- Repository details need not be rendered in the UI.

User/role-aware Brain visibility remains a separate Authentik phase.

## Upstream boundary

v2 remains an application-layer implementation.

Keep in `apps/knowledge-portal`:

- federation registry consumption;
- Brain allowlisting;
- Child Brain semantics;
- canonical/evidence/derived badges;
- routes under `/brains`;
- Adaptive Brain integration.

A future generic GitHub DynamicSource package may be extracted only after the source adapter proves useful outside this product context.

Do not modify Fumadocs core merely to support this portal.

## v2 acceptance criteria

- The portal can render an allowlisted registered Child Brain as Fumadocs pages.
- Only the registered Project-Memory root is projected.
- The source revision is concrete and visible.
- The sidebar Brain switcher is generated from federation metadata.
- Search includes Drive and enabled canonical Child Brains.
- Individual Brain search failures are isolated.
- Empty allowlist exposes no Git-backed Brain.
- No Fumadocs core/UI modification is required.
- No canonical repository write is performed.
- CI passes portal build, type checking, formatting, lint and unit tests.

## Deferred

- Authentik role/user-based Brain visibility;
- relative-link rewriting between Project-Memory pages;
- binary/artifact rendering from Child Brain repositories;
- source-specific search filters/facets;
- canonical-source deep-link controls in the UI;
- generic extraction of the GitHub DynamicSource adapter;
- pagination/rate-limit optimization for very large Project-Memory trees.
