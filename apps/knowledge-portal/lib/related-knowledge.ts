import type { SortedResult } from 'fumadocs-core/search';
import { createFromSource } from 'fumadocs-core/search/server';
import { getDriveSource } from '@/lib/drive-source';
import { getGitHubBrainSource, getRequiredGitHubBrainSource } from '@/lib/github-brains';
import { searchBrainGraph } from '@/lib/search/brain-graph';

export interface RelatedKnowledgeItem {
  title: string;
  url: string;
  sourceClass: 'canonical' | 'evidence' | 'derived';
  sourceLabel: string;
  relation: 'backlink' | 'related';
}

const driveSearch = createFromSource(getDriveSource);
const brainSearch = new Map<string, ReturnType<typeof createFromSource>>();

export async function getRelatedKnowledge(options: {
  title: string;
  currentUrl: string;
  brainId?: string;
  limit?: number;
}): Promise<RelatedKnowledgeItem[]> {
  const limit = options.limit ?? 8;

  const [backlinks, sameSource, graph] = await Promise.all([
    options.brainId
      ? findBrainBacklinks(options.brainId, options.currentUrl, Math.min(limit, 4))
      : Promise.resolve([]),
    searchSameSource(options.title, options.brainId, Math.max(limit, 10)).catch(() => []),
    searchBrainGraph(options.title, Math.max(limit, 10)).catch(() => []),
  ]);

  const related: RelatedKnowledgeItem[] = [
    ...sameSource.map((result) =>
      resultToItem(result, options.brainId ? 'canonical' : 'evidence', options.brainId),
    ),
    ...graph.map((result) => resultToItem(result, 'derived', 'Adaptive Brain')),
  ];

  const seen = new Set<string>([options.currentUrl]);
  const output: RelatedKnowledgeItem[] = [];

  for (const item of [...backlinks, ...related]) {
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    output.push(item);
    if (output.length >= limit) break;
  }

  return output;
}

async function searchSameSource(
  query: string,
  brainId: string | undefined,
  limit: number,
): Promise<SortedResult[]> {
  if (!brainId) return driveSearch.search(query, { limit });

  let search = brainSearch.get(brainId);
  if (!search) {
    search = createFromSource(() => getRequiredGitHubBrainSource(brainId));
    brainSearch.set(brainId, search);
  }
  return search.search(query, { limit });
}

async function findBrainBacklinks(
  brainId: string,
  currentUrl: string,
  limit: number,
): Promise<RelatedKnowledgeItem[]> {
  const source = await getGitHubBrainSource(brainId);
  if (!source) return [];

  const pages = source.getPages().slice(0, 80);
  const output: RelatedKnowledgeItem[] = [];
  let next = 0;

  async function worker() {
    while (output.length < limit) {
      const index = next++;
      if (index >= pages.length) return;

      const page = pages[index];
      if (page.url === currentUrl) continue;

      try {
        const loaded = await page.data.load();
        if (!containsPortalLink(loaded.content, currentUrl)) continue;

        output.push({
          title: page.data.title,
          url: page.url,
          sourceClass: 'canonical',
          sourceLabel: brainId,
          relation: 'backlink',
        });
      } catch {
        // One unreadable page must not suppress the remaining related knowledge.
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(4, pages.length) }, () => worker()));
  return output.slice(0, limit);
}

export function containsPortalLink(markdown: string, url: string): boolean {
  return markdown.includes(`](${url})`) || markdown.includes(`](${url}#`);
}

function resultToItem(
  result: SortedResult,
  sourceClass: RelatedKnowledgeItem['sourceClass'],
  sourceLabel?: string,
): RelatedKnowledgeItem {
  return {
    title: String(result.content).replace(/<\/?mark>/gi, ''),
    url: result.url,
    sourceClass,
    sourceLabel: sourceLabel ?? 'Drive Evidence',
    relation: 'related',
  };
}
