import type { SortedResult } from 'fumadocs-core/search';
import { createFromSource } from 'fumadocs-core/search/server';
import { getDriveRoots } from '@/lib/drive-config';
import { getDriveSource } from '@/lib/drive-source';
import type { KnowledgeSourceClass } from '@/lib/brain-navigation';
import { searchBrainGraph } from '@/lib/search/brain-graph';
import { searchGitHubBrains } from '@/lib/search/github-brains';

const driveSearch = createFromSource(getDriveSource);

export interface KnowledgeSearchResult extends SortedResult {
  sourceClass: KnowledgeSourceClass;
  sourceId: string;
  sourceLabel: string;
}

export interface KnowledgeSearchOptions {
  limit?: number;
  sourceClass?: KnowledgeSourceClass;
  sourceId?: string;
}

export async function searchKnowledge(
  query: string,
  options: KnowledgeSearchOptions = {},
): Promise<KnowledgeSearchResult[]> {
  const limit = normalizeLimit(options.limit);
  if (!query.trim()) return [];

  const [driveResults, brainResults, graphResults] = await Promise.all([
    driveSearch.search(query, { limit }).catch((error) => {
      console.error('Google Drive search failed; returning other sources.', error);
      return [] as SortedResult[];
    }),
    searchGitHubBrains(query, limit).catch((error) => {
      console.error('Federated Child Brain search failed; returning other sources.', error);
      return [] as SortedResult[];
    }),
    searchBrainGraph(query, limit).catch((error) => {
      console.error('Optional Brain Graph search failed; returning canonical sources only.', error);
      return [] as SortedResult[];
    }),
  ]);

  const enriched = [
    ...driveResults.map(enrichDriveResult),
    ...brainResults.map(enrichBrainResult),
    ...graphResults.map(enrichGraphResult),
  ];

  return deduplicate(enriched)
    .filter((result) => !options.sourceClass || result.sourceClass === options.sourceClass)
    .filter((result) => !options.sourceId || matchesSourceId(result, options.sourceId))
    .slice(0, limit);
}

function enrichDriveResult(result: SortedResult): KnowledgeSearchResult {
  const roots = getDriveRoots();
  const firstSlug = result.url.match(/^\/drive\/([^/?#]+)/)?.[1];
  const root = roots.find((item) => item.routePrefix === firstSlug);

  return {
    ...result,
    sourceClass: 'evidence',
    sourceId: root?.routePrefix ? `drive:${root.routePrefix}` : 'drive',
    sourceLabel: root?.label ?? 'Drive Evidence',
  };
}

function enrichBrainResult(result: SortedResult): KnowledgeSearchResult {
  const brainId = result.url.match(/^\/brains\/([^/?#]+)/)?.[1] ?? 'canonical';
  const sourceLabel = result.breadcrumbs?.[0] ?? brainId;

  return {
    ...result,
    sourceClass: 'canonical',
    sourceId: brainId,
    sourceLabel,
  };
}

function enrichGraphResult(result: SortedResult): KnowledgeSearchResult {
  const brainId = result.url.match(/^\/brains\/([^/?#]+)/)?.[1];

  return {
    ...result,
    sourceClass: 'derived',
    sourceId: brainId ? `graph:${brainId}` : 'graph',
    sourceLabel: brainId ? `Adaptive Brain · ${brainId}` : 'Adaptive Brain',
  };
}

export function matchesSourceId(result: KnowledgeSearchResult, sourceId: string): boolean {
  if (sourceId === 'drive') return result.sourceClass === 'evidence';
  if (sourceId === 'graph') return result.sourceClass === 'derived';
  return result.sourceId === sourceId;
}

function normalizeLimit(value?: number): number {
  const parsed = Number.isFinite(value) ? Number(value) : 20;
  return Math.max(1, Math.min(parsed, 50));
}

function deduplicate(results: KnowledgeSearchResult[]): KnowledgeSearchResult[] {
  const seen = new Set<string>();

  return results.filter((result) => {
    const key = `${result.url}::${result.type}::${String(result.content)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
