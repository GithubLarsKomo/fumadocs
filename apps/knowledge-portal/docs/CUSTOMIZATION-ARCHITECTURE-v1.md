# Knowledge Portal Customization Architecture v1

Status: implementation baseline  
Date: 2026-09-28  
Scope: `apps/knowledge-portal`

## Goal

Turn the existing Fumadocs knowledge portal into a governed, individually branded delivery layer for federated knowledge without making Fumadocs, Google Drive, search, or Neo4j an equal-rank Source of Truth.

The preferred customization order is:

1. Fumadocs configuration and slots;
2. portal-local React components and CSS;
3. portal-local server adapters;
4. only then locally copied/customized Fumadocs UI components;
5. framework-core changes only for genuinely generic improvements.

## Source-of-Truth boundaries

| Layer | Role | Authority |
| --- | --- | --- |
| Git-backed Child Brain / owning repository | durable promoted knowledge | canonical for its scope |
| Google Drive | Drive-owned source/evidence documents | canonical for those source documents |
| Adaptive Brain / Neo4j | derived retrieval and adaptive projection | non-canonical |
| Fumadocs knowledge portal | browser delivery, navigation and search | non-canonical |
| Search index / search facade | discovery | non-canonical |

A search hit is a navigation aid, never an authority upgrade. Graph results must retain a route back to their canonical source.

## v1 component map

```text
apps/knowledge-portal/
├── app/
│   ├── api/
│   │   ├── health/route.ts
│   │   └── search/route.ts
│   ├── drive/
│   │   ├── [[...slug]]/page.tsx
│   │   └── layout.tsx
│   ├── global.css
│   └── layout.tsx
├── components/
│   ├── brain-switcher.tsx
│   ├── knowledge-status.tsx
│   ├── provider.tsx
│   └── search.tsx
├── docs/
│   └── CUSTOMIZATION-ARCHITECTURE-v1.md
└── lib/
    ├── brain-navigation.ts
    ├── drive-source.ts
    ├── layout.shared.tsx
    ├── service-account.ts
    └── search/
        └── brain-graph.ts
```

## Brain switcher

The sidebar banner is the first-class navigation surface for source/Brain selection.

Configuration is intentionally outside source code via `KNOWLEDGE_PORTAL_BRAINS_JSON`. The public repository therefore does not need to contain private Brain names, repository URLs, or environment-specific routes.

Example:

```json
[
  {
    "id": "drive",
    "label": "Drive Evidence",
    "url": "/drive",
    "sourceClass": "evidence",
    "description": "Freigegebene Quelldokumente"
  },
  {
    "id": "domain-a",
    "label": "Domain A",
    "url": "/brains/domain-a",
    "sourceClass": "canonical"
  }
]
```

Allowed source classes:

- `canonical` — authoritative promoted knowledge for the declared scope;
- `evidence` — original/source evidence owned by another system;
- `derived` — rebuildable projections such as graph/readback views.

The default configuration contains only the existing Drive evidence source.

## Knowledge status

Every rendered source page should expose its provenance near the title.

For Google Drive the portal displays at least:

- source class: Evidence;
- provider: Google Drive;
- content kind: Markdown, Text or Evidence file;
- modification date when available.

The wording must not imply that a Drive document has been promoted into a Child Brain.

Future Git-backed pages should display `canonical` only when the owning repository actually declares that page authoritative. Neo4j/readback pages remain `derived`.

## Search architecture

The browser uses the normal Fumadocs search client against one portal endpoint:

```text
Fumadocs SearchDialog
        |
        v
GET /api/search?query=...
        |
        +----> Drive/Fumadocs search index
        |
        +----> optional bounded Brain Graph search facade
                       |
                       v
              Adaptive Brain / Neo4j
```

The Drive path is available immediately through Fumadocs structured data.

The graph path is optional. It is enabled only when `BRAIN_GRAPH_SEARCH_URL` is configured. `BRAIN_GRAPH_SEARCH_TOKEN` is server-side only.

### Graph facade contract

The portal does not connect to Neo4j Bolt, expose Cypher, or ship Neo4j credentials to the browser.

The configured graph search URL is a bounded application endpoint in front of, or alongside, the Brain Gateway. v1 sends:

```json
{
  "query": "search text",
  "limit": 20
}
```

and accepts:

```json
{
  "results": [
    {
      "id": "stable-artifact-id",
      "title": "Artifact title",
      "brainId": "owning-brain",
      "canonicalRef": "canonical reference",
      "url": "https://browser-resolvable-target",
      "abstract": "optional summary"
    }
  ]
}
```

Only results with a browser-resolvable `url` are exposed in the Fumadocs dialog. `canonicalRef` is retained conceptually as the authority pointer; the facade owns conversion from canonical references to navigable URLs.

Failures of the optional graph channel fail soft: Drive search continues to work.

## Security

- Google service-account material remains server-side.
- Graph bearer tokens remain server-side.
- No direct public Neo4j ports or arbitrary Cypher.
- Do not put credentials, private repository URLs, provider folder IDs, or user-specific links into committed navigation configuration.
- Rendering a source does not promote it.
- Search ranking does not change knowledge authority.

## Upstream boundary

### Appropriate upstream candidates

Changes may be proposed upstream when they are Fumadocs-generic and have no Ratzeburg-AI or Second-Brain semantics, for example:

- the generic `fumadocs-google-drive` source adapter;
- generic DynamicSource correctness fixes;
- reusable provider metadata contracts;
- generic layout/search extension points needed by multiple Fumadocs users.

### Keep in this fork / portal app

Do not upstream:

- `apps/knowledge-portal`;
- Ratzeburg-AI branding;
- Brain switcher semantics;
- canonical/evidence/derived governance badges;
- federation-specific routing;
- Adaptive Brain / Neo4j gateway configuration;
- Authentik deployment configuration;
- private deployment or source configuration.

### Escalation rule

Do not patch `fumadocs-core` or `fumadocs-ui` merely to customize the portal. First exhaust public props, slots, CSS and app-local components. If a real framework limitation remains, isolate the smallest generic change and assess it separately for upstream.

## v1 acceptance criteria

- No Fumadocs core/UI package modification is required.
- Drive pages visibly state their evidence/source status.
- Sidebar contains a configurable source/Brain switcher.
- Search works for the existing Drive source through `/api/search`.
- Optional graph search can be enabled without browser-side graph credentials.
- Graph failure cannot disable Drive search.
- Navigation configuration can be changed by environment without rebuilding source code.
- Product-specific code remains confined to `apps/knowledge-portal`.
- The generic Google Drive package remains independently upstreamable.

## Deferred after v1

- Git-backed Child Brain content adapter/routes;
- Authentik user/role-aware source visibility;
- graph result facets and source filters;
- provenance detail drawer;
- “Open in canonical source / Obsidian / GitHub” actions;
- semantic/vector search beyond the bounded current graph facade;
- locally copied Fumadocs UI components only if public slots prove insufficient.
