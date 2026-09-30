import type { KnowledgeSearchResult } from '@/lib/search/knowledge-search';
import { getGitHubBrainSource } from '@/lib/github-brains';
import { searchKnowledge } from '@/lib/search/knowledge-search';

export interface RelatedKnowledgeItem {
  title: string;
  url: string;
  sourceClass: 'canonical' | 'evidence' | 'derived';
  sourceLabel: string;
  relation: 'backlink' | 'related';
}

export async function getRelatedKnowledge(options: {
  title: string;
  currentUrl: string;
  brainId?: string;
  limit?: number;
}): Promise<RelatedKnowledgeItem[]> {
  const limit = options.limit ?? 8;
  const [backlinks, searchResults] = await Promise.all([
    options.brainId
      ? findBrainBacklinks(options.brainId, options.currentUrl, Math.min(limit, 6))
      : Promise.resolve([]),
    searchKnowledge(options.title, { limit: Math.max(limit * 2, 12) }).catch(() => []),
  ]);

  const seen = new Set<string>([options.currentUrl]);
  const output: RelatedKnowledgeItem[] = [];

  for (const item of backlinks) {
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    output.push(item);
    if (output.length >= limit) return output;
  }

  for (const result of searchResults) {
    if (seen.has(result.url)) continue;
    seen.add(result.url);
    output.push(searchResultToItem(result));
    if (output.length >= limit) break;
  }

  return output;
}

async function findBrainBacklinks(
  brainId: string,
  currentUrl: string,
  limit: number,
): Promise<RelatedKnowledgeItem[]> {
  const source = await getGitHubBrainSource(brainId);
  if (!source) return [];

  const pages = source.getPages().slice(0, 250);
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
        // A single unreadable page must not suppress related knowledge.
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(6, pages.length) }, () => worker()));
  return output.slice(0, limit);
}

export function containsPortalLink(markdown: string, url: string): boolean {
  return markdown.includes(`](${url})`) || markdown.includes(`](${url}#`);
}

function searchResultToItem(result: KnowledgeSearchResult): RelatedKnowledgeItem {
  return {
    title: String(result.content),
    url: result.url,
    sourceClass: result.sourceClass,
    sourceLabel: result.sourceLabel,
    relation: 'related',
  };
}
