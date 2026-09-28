import type { SortedResult } from 'fumadocs-core/search';
import { createFromSource } from 'fumadocs-core/search/server';
import { getEnabledFederationBrains } from '@/lib/federation';
import { getRequiredGitHubBrainSource } from '@/lib/github-brains';

const searchApis = new Map<string, ReturnType<typeof createFromSource>>();

export async function searchGitHubBrains(query: string, limit: number): Promise<SortedResult[]> {
  const brains = await getEnabledFederationBrains();

  const batches = await Promise.all(
    brains.map(async (brain) => {
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
    }),
  );

  return batches.flat();
}

function getSearchApi(brainId: string) {
  let api = searchApis.get(brainId);
  if (api) return api;

  api = createFromSource(() => getRequiredGitHubBrainSource(brainId));
  searchApis.set(brainId, api);
  return api;
}
