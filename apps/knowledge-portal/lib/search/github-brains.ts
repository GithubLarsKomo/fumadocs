import type { SortedResult } from 'fumadocs-core/search';
import { createFromSource } from 'fumadocs-core/search/server';
import { getEnabledFederationBrains, type FederationBrain } from '@/lib/federation';
import { getRequiredGitHubBrainSource } from '@/lib/github-brains';

const searchApis = new Map<string, ReturnType<typeof createFromSource>>();

export async function searchGitHubBrains(query: string, limit: number): Promise<SortedResult[]> {
  const brains = await getEnabledFederationBrains();
  const concurrency = normalizeConcurrency(process.env.KNOWLEDGE_PORTAL_BRAIN_SEARCH_CONCURRENCY);

  const batches = await mapWithConcurrency(brains, concurrency, async (brain) => {
    try {
      const results = await getSearchApi(brain.brainId).search(query, { limit });
      return results.map((result) => ({
        ...result,
        breadcrumbs: [brain.label, ...(result.breadcrumbs ?? [])],
      }));
    } catch (error) {
      console.error(`GitHub Brain search failed for ${brain.brainId}; skipping source.`, error);
      return [] as SortedResult[];
    }
  });

  return batches.flat();
}

function getSearchApi(brainId: string) {
  let api = searchApis.get(brainId);
  if (api) return api;

  api = createFromSource(() => getRequiredGitHubBrainSource(brainId));
  searchApis.set(brainId, api);
  return api;
}

function normalizeConcurrency(value: string | undefined): number {
  const parsed = value ? Number.parseInt(value, 10) : 4;
  if (!Number.isFinite(parsed)) return 4;
  return Math.max(1, Math.min(parsed, 12));
}

async function mapWithConcurrency<T>(
  items: FederationBrain[],
  concurrency: number,
  task: (item: FederationBrain) => Promise<T>,
): Promise<T[]> {
  const results = new Array<T>(items.length);
  let next = 0;

  async function worker() {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await task(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );

  return results;
}
