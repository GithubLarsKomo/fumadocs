import { describe, expect, it } from 'vitest';
import { googleDrive, type GoogleDrivePage } from '../src/index';

function json(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function asPage(
  files: Awaited<ReturnType<ReturnType<typeof googleDrive>['files']>>,
  title: string,
) {
  const file = files.find((item) => item.type === 'page' && item.data.title === title);
  if (!file || file.type !== 'page') throw new Error(`Missing page: ${title}`);
  return file.data as GoogleDrivePage;
}

describe('googleDrive', () => {
  it('recurses folders and lazily loads Docs, Markdown, text, and evidence pages', async () => {
    const calls: string[] = [];

    const fetchMock = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const url = new URL(raw);
      calls.push(url.href);

      const auth = new Headers(init?.headers).get('Authorization');
      expect(auth).toBe('Bearer test-token');

      if (url.pathname === '/drive/v3/files' && url.searchParams.get('q')?.includes("'root'")) {
        return json({
          files: [
            {
              id: 'folder-1',
              name: 'Architecture',
              mimeType: 'application/vnd.google-apps.folder',
              modifiedTime: '2026-09-28T07:00:00Z',
            },
            {
              id: 'doc-1',
              name: 'Decision Record',
              mimeType: 'application/vnd.google-apps.document',
              modifiedTime: '2026-09-28T07:01:00Z',
              webViewLink: 'https://docs.google.com/document/d/doc-1/edit',
            },
            {
              id: 'md-1',
              name: 'README.md',
              mimeType: 'text/markdown',
              modifiedTime: '2026-09-28T07:02:00Z',
              webViewLink: 'https://drive.google.com/file/d/md-1/view',
            },
            {
              id: 'pdf-1',
              name: 'Evidence.pdf',
              mimeType: 'application/pdf',
              modifiedTime: '2026-09-28T07:03:00Z',
              webViewLink: 'https://drive.google.com/file/d/pdf-1/view',
            },
            {
              id: 'image-1',
              name: 'Architecture Overview.png',
              mimeType: 'image/png',
              modifiedTime: '2026-09-28T07:03:30Z',
              webViewLink: 'https://drive.google.com/file/d/image-1/view',
            },
          ],
        });
      }

      if (url.pathname === '/drive/v3/files' && url.searchParams.get('q')?.includes("'folder-1'")) {
        return json({
          files: [
            {
              id: 'txt-1',
              name: 'Notes.txt',
              mimeType: 'text/plain',
              modifiedTime: '2026-09-28T07:04:00Z',
              webViewLink: 'https://drive.google.com/file/d/txt-1/view',
            },
          ],
        });
      }

      if (url.pathname === '/drive/v3/files/doc-1/export') {
        expect(url.searchParams.get('mimeType')).toBe('text/markdown');
        return new Response('# Decision\n\nUse Git as canonical knowledge.', { status: 200 });
      }

      if (url.pathname === '/drive/v3/files/md-1') {
        expect(url.searchParams.get('alt')).toBe('media');
        expect(url.searchParams.get('supportsAllDrives')).toBe('true');
        return new Response('# README\n\nDrive-backed Markdown.', { status: 200 });
      }

      if (url.pathname === '/drive/v3/files/txt-1') {
        return new Response('plain notes', { status: 200 });
      }

      throw new Error(`Unexpected request: ${url.href}`);
    }) as typeof fetch;

    const source = googleDrive({
      rootFolderId: 'root',
      getAccessToken: () => 'test-token',
      fetch: fetchMock,
      apiBase: 'https://example.test/drive/v3',
      staleTime: 0,
    });

    const files = await source.files();

    expect(
      files.some((file) => file.type === 'meta' && file.path === 'architecture/meta.json'),
    ).toBe(true);

    const doc = asPage(files, 'Decision Record');
    const markdown = asPage(files, 'README.md');
    const text = asPage(files, 'Notes.txt');
    const evidence = asPage(files, 'Evidence.pdf');
    const image = asPage(files, 'Architecture Overview.png');

    expect(doc.driveFile.id).toBe('doc-1');
    expect(doc.sourceClass).toBe('evidence');
    expect(doc.contentKind).toBe('markdown');
    expect((await doc.load()).content).toContain('Git as canonical knowledge');

    expect(markdown.contentKind).toBe('markdown');
    expect((await markdown.load()).content).toContain('Drive-backed Markdown');

    expect(text.contentKind).toBe('text');
    expect((await text.load()).content).toBe('plain notes');

    const evidenceLoaded = await evidence.load();
    expect(evidenceLoaded.contentKind).toBe('evidence');
    expect(evidenceLoaded.content).toContain('Open the original in Google Drive');
    expect(evidenceLoaded.content).toContain('application/pdf');

    const imageLoaded = await image.load();
    expect(imageLoaded.contentKind).toBe('evidence');
    expect(imageLoaded.content).toContain('Open the original in Google Drive');
    expect(imageLoaded.content).toContain('image/png');

    const structured = await doc.structuredData();
    expect(structured.headings[0]).toEqual({
      id: 'decision',
      content: 'Decision',
    });
    expect(structured.contents[0]?.content).toContain('Use Git as canonical knowledge');

    expect(calls.some((url) => url.includes('/files/doc-1/export'))).toBe(true);
  });

  it('adds Shared Drive list parameters and disambiguates duplicate slugs', async () => {
    let listUrl: URL | undefined;

    const fetchMock = (async (input: RequestInfo | URL) => {
      const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const url = new URL(raw);

      if (url.pathname === '/drive/v3/files') {
        listUrl = url;
        return json({
          files: [
            {
              id: 'a1111111',
              name: 'Same.md',
              mimeType: 'text/markdown',
              modifiedTime: '2026-09-28T07:00:00Z',
            },
            {
              id: 'b2222222',
              name: 'Same.md',
              mimeType: 'text/markdown',
              modifiedTime: '2026-09-28T07:00:00Z',
            },
          ],
        });
      }

      throw new Error(`Unexpected request: ${url.href}`);
    }) as typeof fetch;

    const source = googleDrive({
      rootFolderId: 'shared-root',
      driveId: 'shared-drive-id',
      getAccessToken: () => 'test-token',
      fetch: fetchMock,
      apiBase: 'https://example.test/drive/v3',
    });

    const files = await source.files();
    const paths = files.filter((file) => file.type === 'page').map((file) => file.path);

    expect(listUrl?.searchParams.get('corpora')).toBe('drive');
    expect(listUrl?.searchParams.get('driveId')).toBe('shared-drive-id');
    expect(listUrl?.searchParams.get('supportsAllDrives')).toBe('true');
    expect(listUrl?.searchParams.get('includeItemsFromAllDrives')).toBe('true');

    expect(paths).toEqual(['same--a1111111.mdx', 'same--b2222222.mdx']);
  });

  it('fails closed without a usable access token', async () => {
    const source = googleDrive({
      rootFolderId: 'root',
      getAccessToken: () => '',
      fetch: (async () => json({ files: [] })) as typeof fetch,
      apiBase: 'https://example.test/drive/v3',
    });

    await expect(source.files()).rejects.toThrow('empty token');
  });
});
