import type { SortedResult } from 'fumadocs-core/search';
import { createFromSource } from 'fumadocs-core/search/server';
import { getDriveSource } from '@/lib/drive-source';
import { searchBrainGraph } from '@/lib/search/brain-graph';

const driveSearch = createFromSource(getDriveSource);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('query')?.trim() ?? '';
  const limit = normalizeLimit(url.searchParams.get('limit'));

  if (!query) return Response.json([]);

  const [driveResults, graphResults] = await Promise.all([
    driveSearch.search(query, { limit }),
    searchBrainGraph(query, limit).catch((error) => {
      console.error('Optional Brain Graph search failed; returning Drive results only.', error);
      return [] as SortedResult[];
    }),
  ]);

  return Response.json(deduplicate([...driveResults, ...graphResults]).slice(0, limit));
}

function normalizeLimit(value: string | null): number {
  const parsed = value ? Number.parseInt(value, 10) : 20;
  if (!Number.isFinite(parsed)) return 20;
  return Math.max(1, Math.min(parsed, 50));
}

function deduplicate(results: SortedResult[]): SortedResult[] {
  const seen = new Set<string>();

  return results.filter((result) => {
    const key = `${result.url}::${result.type}::${String(result.content)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
