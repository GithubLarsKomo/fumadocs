# fumadocs-google-drive

Experimental read-only Google Drive content source for the `GithubLarsKomo/fumadocs` fork.

Phase 0 is intentionally read-only: it projects Drive-owned source documents into Fumadocs without creating a second writable knowledge store.

## Phase 0 scope

- recurse one configured Google Drive folder;
- support My Drive and Shared Drives;
- export Google Docs as `text/markdown`;
- download `.md`, `.markdown`, and `.txt` files directly;
- expose PDF, DOCX, XLSX, PPTX, Google Sheets, Google Slides, PNG, JPEG, WebP, and SVG as evidence pages linking to the Drive original;
- preserve Drive provenance metadata on every page;
- perform no writes to Google Drive;
- perform no automatic promotion from Drive into Git-backed knowledge.

Google Drive remains authoritative for Drive-owned source documents. Git-backed Child Brains remain authoritative for promoted/canonical knowledge.

## Usage

```ts
import { dynamicLoader } from 'fumadocs-core/source';
import { googleDrive } from 'fumadocs-google-drive';

const driveSource = googleDrive({
  rootFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID!,
  driveId: process.env.GOOGLE_SHARED_DRIVE_ID,
  getAccessToken: async () => {
    // Resolve a server-side OAuth access token here.
    // Never expose this token to page data or the browser.
    return getGoogleAccessToken();
  },
  sourceClass: 'evidence',
  staleTime: 60_000,
});

const loader = dynamicLoader(driveSource, {
  baseUrl: '/drive',
});

export async function getDriveSource() {
  return loader.get();
}
```

A page returned by the loader contains Drive provenance:

```ts
const source = await getDriveSource();
const page = source.getPage(['architecture', 'decision-record']);

if (page) {
  console.log(page.data.driveFile.id);
  console.log(page.data.driveFile.modifiedTime);
  console.log(page.data.driveFile.webViewLink);

  const loaded = await page.data.load();
  console.log(loaded.content);
}
```

Render `loaded.content` with Fumadocs' Markdown renderer or another Markdown renderer:

```tsx
import { Markdown } from 'fumadocs-core/content/md';

const loaded = await page.data.load();

return <Markdown>{loaded.content}</Markdown>;
```

## Authentication

The package deliberately does not depend on the Google SDK. Supply a server-side `getAccessToken()` callback.

This keeps authentication independent from the content adapter and allows deployments to use OAuth, a service account, or another Google Workspace credential strategy without changing the source implementation.

Use the smallest read scope appropriate for the deployment and restrict the technical identity to the folders/Shared Drives that the portal must read.

## Shared Drives

Set `driveId` when the root folder belongs to a Shared Drive. The source then lists with the Drive corpus and the Google Drive API's all-drives flags.

## Content handling

| Drive item         | Phase 0 behavior           |
| ------------------ | -------------------------- |
| Google Doc         | export to Markdown         |
| `.md`, `.markdown` | direct download            |
| `.txt`             | direct download            |
| PDF                | evidence page + Drive link |
| DOCX               | evidence page + Drive link |
| XLSX               | evidence page + Drive link |
| PPTX               | evidence page + Drive link |
| Google Sheet       | evidence page + Drive link |
| Google Slides      | evidence page + Drive link |
| PNG/JPEG/WebP/SVG  | evidence page + Drive link |
| other types        | ignored                    |

Google Workspace exports are subject to Google Drive API export limits.

## Deliberate non-goals

Phase 0 does **not**:

- write or rename Drive files;
- synchronize Drive files into Git;
- convert Office/PDF files to Markdown;
- index Drive content in Neo4j or another vector database;
- resolve `canonicalRef` relationships automatically;
- implement per-file authorization beyond what the Google identity can read.

Those belong to later, separately governed layers.

## Live Drive smoke test

After building the package, a real Drive folder can be validated without adding any user-specific Drive IDs or credentials to the repository:

```bash
pnpm --filter fumadocs-google-drive build

GOOGLE_DRIVE_FOLDER_ID="<folder-id>" \
GOOGLE_DRIVE_ACCESS_TOKEN="<short-lived-access-token>" \
pnpm --filter fumadocs-google-drive smoke:live
```

For a Shared Drive, also set `GOOGLE_SHARED_DRIVE_ID`.

The smoke test deliberately fails unless the configured folder contains at least:

- one Google Doc, Markdown file, or text file that can be loaded as content;
- one supported evidence item such as Google Sheets, Google Slides, PDF, DOCX, XLSX, PPTX, PNG, JPEG, WebP, or SVG.

It prints only non-secret source metadata and content length. The access token and folder ID are never written to the repository or included in page data.

A successful live smoke test proves folder listing, file classification, Google Docs Markdown export, lazy page loading, and evidence-page discovery against the real Google Drive API. It does not test end-user authentication UI or automatic Git promotion.
