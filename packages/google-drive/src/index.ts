import type { StructuredData } from 'fumadocs-core/mdx-plugins/remark-structure';
import type { DynamicSource, MetaData, PageData, VirtualFile } from 'fumadocs-core/source';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const GOOGLE_DOC_MIME = 'application/vnd.google-apps.document';
const GOOGLE_SHEET_MIME = 'application/vnd.google-apps.spreadsheet';
const GOOGLE_SLIDES_MIME = 'application/vnd.google-apps.presentation';
const PDF_MIME = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

const linkedMimeTypes = new Set([
  GOOGLE_SHEET_MIME,
  GOOGLE_SLIDES_MIME,
  PDF_MIME,
  DOCX_MIME,
  XLSX_MIME,
  PPTX_MIME,
]);

export type GoogleDriveContentKind = 'markdown' | 'text' | 'link';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
  description?: string;
  parents?: string[];
}

export interface GoogleDriveFileRef {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface GoogleDriveLoadedPage {
  content: string;
  contentKind: GoogleDriveContentKind;
  sourceType: 'google-drive';
  file: GoogleDriveFileRef;
}

export interface GoogleDrivePage extends PageData {
  title: string;
  description?: string;
  sourceType: 'google-drive';
  contentKind: GoogleDriveContentKind;
  driveFile: GoogleDriveFileRef;
  load: () => Promise<GoogleDriveLoadedPage>;
  structuredData: () => Promise<StructuredData>;
}

export interface CreateGoogleDriveOptions {
  /** Server-side OAuth access token provider. Tokens are never exposed to page data. */
  getAccessToken: () => string | Promise<string>;

  /** Override fetch for tests or controlled runtimes. */
  fetch?: typeof globalThis.fetch;

  /** Override the Drive API base URL for tests. */
  apiBase?: string;
}

export interface GoogleDriveSourceOptions {
  /** Folder that becomes the root of this source. Use "root" for My Drive root. */
  rootFolderId: string;

  /** Optional Shared Drive ID. When present, list requests use the Drive corpus. */
  driveId?: string;

  /** Virtual source directory. This changes virtual paths, not public slugs. */
  baseDir?: string;

  /** Dynamic loader revalidation interval. Defaults to 60 seconds. */
  staleTime?: number;

  /** Maximum folder recursion depth. Defaults to 50. */
  maxDepth?: number;

  /** Include supported non-text files as linked pages. Defaults to true. */
  includeLinkedFiles?: boolean;
}

type GoogleDriveSourceConfig = {
  pageData: GoogleDrivePage;
  metaData: MetaData;
};

type GoogleDriveVirtualFile = VirtualFile<GoogleDriveSourceConfig>;

interface DriveFileList {
  nextPageToken?: string;
  files?: GoogleDriveFile[];
}

export interface GoogleDriveIntegration {
  $inferPage: GoogleDrivePage;
  dynamicSource: (options: GoogleDriveSourceOptions) => DynamicSource<GoogleDriveSourceConfig>;
}

/**
 * Create a read-only Google Drive integration for Fumadocs.
 *
 * Authentication is supplied by the caller so applications can use OAuth,
 * service accounts, workload identity, or another server-side strategy.
 */
export function createGoogleDrive({
  getAccessToken,
  fetch: customFetch,
  apiBase = DRIVE_API,
}: CreateGoogleDriveOptions): GoogleDriveIntegration {
  const fetcher = customFetch ?? globalThis.fetch;
  if (!fetcher) throw new Error('[@fumadocs/google-drive] A fetch implementation is required.');

  const normalizedApiBase = apiBase.replace(/\/$/, '');

  return {
    $inferPage: undefined as never,
    dynamicSource(options) {
      if (!options.rootFolderId.trim()) {
        throw new TypeError('[@fumadocs/google-drive] rootFolderId must not be empty.');
      }

      const staleTime = options.staleTime ?? 60_000;
      const maxDepth = options.maxDepth ?? 50;
      if (!Number.isInteger(maxDepth) || maxDepth < 0) {
        throw new TypeError('[@fumadocs/google-drive] maxDepth must be a non-negative integer.');
      }

      const includeLinkedFiles = options.includeLinkedFiles ?? true;
      const baseDir = normalizeBaseDir(options.baseDir);
      let fileCache = new Map<string, GoogleDriveVirtualFile>();

      async function request(url: string): Promise<Response> {
        const accessToken = await getAccessToken();
        if (!accessToken) {
          throw new Error(
            '[@fumadocs/google-drive] Access token provider returned an empty token.',
          );
        }

        const response = await fetcher(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json, text/plain, text/markdown, */*',
          },
        });

        if (!response.ok) {
          throw new Error(
            `[@fumadocs/google-drive] Google Drive request failed with HTTP ${response.status}.`,
          );
        }
        return response;
      }

      async function requestJson<T>(url: string): Promise<T> {
        return (await request(url)).json() as Promise<T>;
      }

      async function requestText(url: string): Promise<string> {
        return (await request(url)).text();
      }

      async function listFolder(folderId: string): Promise<GoogleDriveFile[]> {
        const files: GoogleDriveFile[] = [];
        let pageToken: string | undefined;

        do {
          const params = new URLSearchParams({
            q: `'${escapeDriveQuery(folderId)}' in parents and trashed = false`,
            spaces: 'drive',
            pageSize: '1000',
            supportsAllDrives: 'true',
            includeItemsFromAllDrives: 'true',
            fields:
              'nextPageToken,files(id,name,mimeType,modifiedTime,webViewLink,description,parents)',
            orderBy: 'folder,name_natural',
          });

          if (options.driveId) {
            params.set('corpora', 'drive');
            params.set('driveId', options.driveId);
          }
          if (pageToken) params.set('pageToken', pageToken);

          const page = await requestJson<DriveFileList>(`${normalizedApiBase}/files?${params}`);
          files.push(...(page.files ?? []));
          pageToken = page.nextPageToken;
        } while (pageToken);

        return files.sort((a, b) => {
          const aFolder = a.mimeType === FOLDER_MIME ? 0 : 1;
          const bFolder = b.mimeType === FOLDER_MIME ? 0 : 1;
          return aFolder - bFolder || a.name.localeCompare(b.name);
        });
      }

      async function loadFile(
        file: GoogleDriveFile,
        contentKind: GoogleDriveContentKind,
      ): Promise<GoogleDriveLoadedPage> {
        let content: string;

        if (file.mimeType === GOOGLE_DOC_MIME) {
          const params = new URLSearchParams({ mimeType: 'text/markdown' });
          content = await requestText(
            `${normalizedApiBase}/files/${encodeURIComponent(file.id)}/export?${params}`,
          );
        } else if (contentKind === 'markdown' || contentKind === 'text') {
          const params = new URLSearchParams({
            alt: 'media',
            supportsAllDrives: 'true',
          });
          content = await requestText(
            `${normalizedApiBase}/files/${encodeURIComponent(file.id)}?${params}`,
          );
        } else {
          content = linkedFileMarkdown(file);
        }

        return {
          content,
          contentKind,
          sourceType: 'google-drive',
          file: toFileRef(file),
        };
      }

      function toPage(
        file: GoogleDriveFile,
        segments: string[],
        segment: string,
        contentKind: GoogleDriveContentKind,
      ): GoogleDriveVirtualFile {
        const slugs = [...segments, segment];
        const virtualPath = joinVirtualPath(baseDir, ...slugs) + '.mdx';
        const cacheKey = cacheKeyFor(file, virtualPath);

        const existing = fileCache.get(cacheKey);
        if (existing) return existing;

        let loaded: Promise<GoogleDriveLoadedPage> | undefined;
        const load = () => (loaded ??= loadFile(file, contentKind));

        return {
          type: 'page',
          path: virtualPath,
          slugs,
          data: {
            title: file.name,
            description: file.description ?? descriptionFor(file, contentKind),
            sourceType: 'google-drive',
            contentKind,
            driveFile: toFileRef(file),
            load,
            structuredData: async () => markdownStructuredData((await load()).content),
          },
        };
      }

      function folderMeta(file: GoogleDriveFile, segments: string[]): GoogleDriveVirtualFile {
        return {
          type: 'meta',
          path: joinVirtualPath(baseDir, ...segments, 'meta.json'),
          data: {
            title: file.name,
          },
        };
      }

      return {
        cache: 'memory',
        staleTime,
        async files() {
          const next = new Map<string, GoogleDriveVirtualFile>();
          const output: GoogleDriveVirtualFile[] = [];
          const visited = new Set<string>();

          async function walk(folderId: string, segments: string[], depth: number): Promise<void> {
            if (depth > maxDepth) {
              throw new Error(
                `[@fumadocs/google-drive] Folder depth exceeds configured maxDepth (${maxDepth}).`,
              );
            }
            if (visited.has(folderId)) return;
            visited.add(folderId);

            const children = await listFolder(folderId);
            const segmentCounts = new Map<string, number>();
            const candidates = children.map((file) => {
              const segment = slugFor(file);
              segmentCounts.set(segment, (segmentCounts.get(segment) ?? 0) + 1);
              return { file, segment };
            });

            for (const item of candidates) {
              const { file } = item;
              const duplicate = (segmentCounts.get(item.segment) ?? 0) > 1;
              const segment = duplicate ? `${item.segment}--${shortId(file.id)}` : item.segment;

              if (file.mimeType === FOLDER_MIME) {
                const folderSegments = [...segments, segment];
                output.push(folderMeta(file, folderSegments));
                await walk(file.id, folderSegments, depth + 1);
                continue;
              }

              const contentKind = classify(file, includeLinkedFiles);
              if (!contentKind) continue;

              const virtual = toPage(file, segments, segment, contentKind);
              next.set(cacheKeyFor(file, virtual.path), virtual);
              output.push(virtual);
            }
          }

          await walk(options.rootFolderId, [], 0);
          fileCache = next;
          return output;
        },
        invalidate() {
          fileCache.clear();
        },
      };
    },
  };
}

function classify(
  file: GoogleDriveFile,
  includeLinkedFiles: boolean,
): GoogleDriveContentKind | undefined {
  if (file.mimeType === GOOGLE_DOC_MIME) return 'markdown';

  const extension = extensionOf(file.name);
  if (file.mimeType === 'text/markdown' || extension === 'md' || extension === 'markdown') {
    return 'markdown';
  }
  if (file.mimeType === 'text/plain' || extension === 'txt') return 'text';
  if (includeLinkedFiles && linkedMimeTypes.has(file.mimeType)) return 'link';

  return undefined;
}

function descriptionFor(
  file: GoogleDriveFile,
  contentKind: GoogleDriveContentKind,
): string | undefined {
  if (contentKind !== 'link') return undefined;
  return `Google Drive file (${file.mimeType})`;
}

function linkedFileMarkdown(file: GoogleDriveFile): string {
  const lines = [
    `# ${file.name}`,
    '',
    'This file type is not converted to Markdown by the Google Drive integration.',
    '',
    `- **MIME type:** \`${file.mimeType}\``,
  ];

  if (file.modifiedTime) lines.push(`- **Last modified:** ${file.modifiedTime}`);
  if (file.webViewLink) {
    lines.push('', `[Open the original in Google Drive](${file.webViewLink})`);
  }

  return lines.join('\n');
}

function toFileRef(file: GoogleDriveFile): GoogleDriveFileRef {
  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    modifiedTime: file.modifiedTime,
    webViewLink: file.webViewLink,
  };
}

function cacheKeyFor(file: GoogleDriveFile, virtualPath: string): string {
  return [
    file.id,
    file.modifiedTime ?? '',
    virtualPath,
    file.mimeType,
    file.name,
    file.webViewLink ?? '',
  ].join(':');
}

function markdownStructuredData(markdown: string): StructuredData {
  const structured: StructuredData = {
    headings: [],
    contents: [],
  };
  const occurrences = new Map<string, number>();
  let activeHeading: string | undefined;
  let paragraph: string[] = [];

  function flush() {
    const content = cleanMarkdown(paragraph.join(' ').trim());
    paragraph = [];
    if (!content) return;
    structured.contents.push({
      heading: activeHeading,
      content,
    });
  }

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    const heading = /^(#{1,6})\s+(.+?)\s*$/.exec(line);

    if (heading) {
      flush();
      const content = cleanMarkdown(heading[2]);
      const base = slugify(content) || 'section';
      const count = (occurrences.get(base) ?? 0) + 1;
      occurrences.set(base, count);
      activeHeading = count === 1 ? base : `${base}-${count}`;
      structured.headings.push({
        id: activeHeading,
        content,
      });
      continue;
    }

    if (!line) {
      flush();
      continue;
    }
    paragraph.push(line);
  }

  flush();
  return structured;
}

function cleanMarkdown(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_~`>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugFor(file: GoogleDriveFile): string {
  const withoutExtension =
    file.mimeType === FOLDER_MIME || file.mimeType.startsWith('application/vnd.google-apps.')
      ? file.name
      : file.name.replace(/\.(?:md|markdown|txt|pdf|docx|xlsx|pptx)$/i, '');

  return slugify(withoutExtension) || `file-${shortId(file.id)}`;
}

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replaceAll(/\p{M}/gu, '')
    .toLowerCase()
    .replaceAll(/[^\p{L}\p{N}]+/gu, '-')
    .replaceAll(/^-|-$/g, '');
}

function shortId(id: string): string {
  return (
    id
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 8)
      .toLowerCase() || 'item'
  );
}

function extensionOf(name: string): string {
  const match = /\.([^.]+)$/.exec(name);
  return match?.[1]?.toLowerCase() ?? '';
}

function normalizeBaseDir(baseDir?: string): string {
  const normalized = baseDir?.replaceAll('\\', '/').replace(/^\/+|\/+$/g, '') ?? '';
  if (normalized.split('/').some((part) => part === '.' || part === '..')) {
    throw new Error(`[@fumadocs/google-drive] Invalid baseDir: ${baseDir}`);
  }
  return normalized;
}

function joinVirtualPath(...parts: string[]): string {
  return parts
    .flatMap((part) => part.split('/'))
    .filter(Boolean)
    .join('/');
}

function escapeDriveQuery(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll("'", "\\'");
}
