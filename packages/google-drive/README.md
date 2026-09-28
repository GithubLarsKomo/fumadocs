# @fumadocs/google-drive

Read-only Google Drive content source for Fumadocs.

It exposes a configured Drive folder as a Fumadocs dynamic source while leaving authentication strategy to the application.

## Features

- recursively read one configured Google Drive folder;
- support My Drive and Shared Drives;
- export Google Docs as Markdown;
- download `.md`, `.markdown`, and `.txt` files directly;
- optionally expose PDF, DOCX, XLSX, PPTX, Google Sheets, and Google Slides as linked pages;
- preserve Drive file metadata on every page;
- generate structured data for Fumadocs search;
- perform no writes to Google Drive.

## Usage

```ts
import { dynamicLoader } from 'fumadocs-core/source';
import { createGoogleDrive } from '@fumadocs/google-drive';

const drive = createGoogleDrive({
  getAccessToken: async () => {
    // Resolve a server-side OAuth access token here.
    // Never expose this token to the browser.
    return getGoogleAccessToken();
  },
});

const loader = dynamicLoader(
  drive.dynamicSource({
    rootFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID!,
    driveId: process.env.GOOGLE_SHARED_DRIVE_ID,
    staleTime: 60_000,
  }),
  {
    baseUrl: '/drive',
  },
);

export async function getDriveSource() {
  return loader.get();
}
```

A returned page includes the original Drive file metadata:

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

Render the loaded Markdown with Fumadocs:

```tsx
import { Markdown } from 'fumadocs-core/content/md';

const loaded = await page.data.load();

return <Markdown>{loaded.content}</Markdown>;
```

## Authentication

The integration deliberately does not depend on the Google SDK or a particular credential flow. Supply a server-side `getAccessToken()` callback.

This allows deployments to use OAuth, a service account, workload identity, or another Google Workspace credential strategy without coupling authentication to the content source.

Use the smallest read scope appropriate for the deployment and restrict the technical identity to the folders or Shared Drives the site must read.

## Shared Drives

Set `driveId` when the root folder belongs to a Shared Drive. The source then lists files from that Drive corpus and includes the Google Drive API all-drives parameters.

## Content handling

| Drive item         | Behavior                    |
| ------------------ | --------------------------- |
| Google Doc         | export to Markdown          |
| `.md`, `.markdown` | direct download             |
| `.txt`             | direct download             |
| PDF                | linked page                 |
| DOCX               | linked page                 |
| XLSX               | linked page                 |
| PPTX               | linked page                 |
| Google Sheet       | linked page                 |
| Google Slides      | linked page                 |
| other types        | ignored                     |

Set `includeLinkedFiles: false` to omit the non-text linked-page types.

Google Workspace exports are subject to Google Drive API export limits.

## Live Drive smoke test

After building the package, a real Drive folder can be validated without adding Drive IDs or credentials to the repository:

```bash
pnpm --filter @fumadocs/google-drive build

GOOGLE_DRIVE_FOLDER_ID="<folder-id>" \
GOOGLE_DRIVE_ACCESS_TOKEN="<short-lived-access-token>" \
pnpm --filter @fumadocs/google-drive smoke:live
```

For a Shared Drive, also set `GOOGLE_SHARED_DRIVE_ID`.

The smoke test prints only non-secret source metadata and content length. The access token and folder ID are never written to the repository or included in page data.
