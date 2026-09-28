import type { StructuredData } from 'fumadocs-core/mdx-plugins/remark-structure';
import type { DynamicSource, MetaData, PageData, VirtualFile } from 'fumadocs-core/source';
import type { FederationBrain } from '@/lib/federation';
import { encodeGitHubPath, encodeRepository, githubJson } from '@/lib/github-client';

interface GitHubDirectoryEntry {
  type: 'file' | 'dir' | string;
  name: string;
  path: string;
  sha: string;
}

interface GitHubCommitResponse {
  sha: string;
}

interface GitHubBlobResponse {
  encoding?: string;
  content?: string;
}

export interface GitHubBrainLoadedPage {
  content: string;
  sourceType: 'github-brain';
  sourceClass: 'canonical';
  brainId: string;
  repository: string;
  path: string;
  canonicalRef: string;
  sourceRevision: string;
  sourceUrl: string;
}

export interface GitHubBrainPage extends PageData {
  title: string;
  description?: string;
  sourceType: 'github-brain';
  sourceClass: 'canonical';
  brainId: string;
  repository: string;
  sourcePath: string;
  canonicalRef: string;
  sourceRevision: string;
  sourceUrl: string;
  load: () => Promise<GitHubBrainLoadedPage>;
  structuredData: () => Promise<StructuredData>;
}

type GitHubBrainSourceConfig = {
  pageData: GitHubBrainPage;
  metaData: MetaData;
};

type GitHubBrainVirtualFile = VirtualFile<GitHubBrainSourceConfig>;

export function githubBrainSource(brain: FederationBrain): DynamicSource<GitHubBrainSourceConfig> {
  const repo = encodeRepository(brain.repository);
  const rootPath = brain.rootPath.replace(/^\/+|\/+$/g, '');
  const blobCache = new Map<string, Promise<string>>();

  async function loadBlob(sha: string): Promise<string> {
    let cached = blobCache.get(sha);
    if (cached) return cached;

    cached = githubJson<GitHubBlobResponse>(`/repos/${repo}/git/blobs/${encodeURIComponent(sha)}`)
      .then((blob) => {
        if (blob.encoding !== 'base64' || !blob.content) {
          throw new Error(`GitHub blob ${sha} is not base64 encoded.`);
        }
        return Buffer.from(blob.content.replace(/\s/g, ''), 'base64').toString('utf8');
      })
      .catch((error) => {
        blobCache.delete(sha);
        throw error;
      });

    blobCache.set(sha, cached);
    return cached;
  }

  async function listDirectory(path: string, revision: string): Promise<GitHubDirectoryEntry[]> {
    const encodedPath = encodeGitHubPath(path);
    const endpoint = encodedPath
      ? `/repos/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(revision)}`
      : `/repos/${repo}/contents?ref=${encodeURIComponent(revision)}`;
    const response = await githubJson<GitHubDirectoryEntry[] | GitHubDirectoryEntry>(endpoint);

    if (!Array.isArray(response)) {
      throw new Error(`GitHub path ${path || '/'} is not a directory.`);
    }

    return response.sort((a, b) => {
      const aDir = a.type === 'dir' ? 0 : 1;
      const bDir = b.type === 'dir' ? 0 : 1;
      return aDir - bDir || a.name.localeCompare(b.name);
    });
  }

  async function resolveRevision(): Promise<string> {
    const commit = await githubJson<GitHubCommitResponse>(
      `/repos/${repo}/commits/${encodeURIComponent(brain.defaultBranch)}`,
    );
    if (!commit.sha) throw new Error(`GitHub did not return a revision for ${brain.repository}.`);
    return commit.sha;
  }

  function pageFor(
    entry: GitHubDirectoryEntry,
    relativePath: string,
    revision: string,
  ): GitHubBrainVirtualFile {
    const slugs = slugsFor(relativePath);
    const virtualPath = relativePath.replace(/\.(?:md|mdx)$/i, '.mdx');
    const canonicalRef = `github://${brain.repository}@${revision}/${entry.path}`;
    const sourceUrl = `https://github.com/${brain.repository}/blob/${revision}/${encodeGitHubPath(entry.path)}`;

    let loaded: Promise<GitHubBrainLoadedPage> | undefined;
    const load = () =>
      (loaded ??= loadBlob(entry.sha).then((content) => ({
        content,
        sourceType: 'github-brain' as const,
        sourceClass: 'canonical' as const,
        brainId: brain.brainId,
        repository: brain.repository,
        path: entry.path,
        canonicalRef,
        sourceRevision: revision,
        sourceUrl,
      })));

    return {
      type: 'page',
      path: virtualPath,
      slugs,
      data: {
        title: titleFor(relativePath, brain.label),
        description: relativePath === 'INDEX.md' ? brain.scope : undefined,
        sourceType: 'github-brain',
        sourceClass: 'canonical',
        brainId: brain.brainId,
        repository: brain.repository,
        sourcePath: entry.path,
        canonicalRef,
        sourceRevision: revision,
        sourceUrl,
        load,
        structuredData: async () => markdownStructuredData((await load()).content),
      },
    };
  }

  return {
    cache: 'memory',
    staleTime: 60_000,
    async files() {
      const revision = await resolveRevision();
      const files: GitHubBrainVirtualFile[] = [];
      const visited = new Set<string>();

      async function walk(currentPath: string, relativeDir: string, depth: number): Promise<void> {
        if (depth > 25) {
          throw new Error(`GitHub Brain folder depth exceeds 25 for ${brain.brainId}.`);
        }
        if (visited.has(currentPath)) return;
        visited.add(currentPath);

        const entries = await listDirectory(currentPath, revision);

        for (const entry of entries) {
          if (entry.type === 'dir') {
            const nextRelative = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
            files.push({
              type: 'meta',
              path: `${nextRelative}/meta.json`,
              data: {
                title: humanize(entry.name),
              },
            });
            await walk(entry.path, nextRelative, depth + 1);
            continue;
          }

          if (entry.type !== 'file' || !/\.(?:md|mdx)$/i.test(entry.name)) continue;

          const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
          files.push(pageFor(entry, relativePath, revision));
        }
      }

      await walk(rootPath, '', 0);
      return files;
    },
    invalidate() {
      blobCache.clear();
    },
  };
}

function slugsFor(relativePath: string): string[] {
  const parts = relativePath.split('/').filter(Boolean);
  const file = parts.pop();
  if (!file) return [];

  const stem = file.replace(/\.(?:md|mdx)$/i, '');
  if (/^index$/i.test(stem)) return parts.map(slugify);

  return [...parts, stem].map(slugify);
}

function titleFor(relativePath: string, brainLabel: string): string {
  const parts = relativePath.split('/').filter(Boolean);
  const file = parts.at(-1) ?? relativePath;
  const stem = file.replace(/\.(?:md|mdx)$/i, '');

  if (/^index$/i.test(stem)) {
    return parts.length <= 1 ? brainLabel : humanize(parts.at(-2) ?? brainLabel);
  }

  return humanize(stem);
}

function humanize(value: string): string {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
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
