import type { SortedResult } from 'fumadocs-core/search';

interface BrainGraphSearchItem {
  id: string;
  title: string;
  brainId?: string;
  canonicalRef?: string;
  url?: string;
  abstract?: string;
}

interface BrainGraphSearchResponse {
  results?: BrainGraphSearchItem[];
}

export async function searchBrainGraph(query: string, limit: number): Promise<SortedResult[]> {
  const endpoint = process.env.BRAIN_GRAPH_SEARCH_URL;
  if (!endpoint) return [];

  const headers: HeadersInit = {
    accept: 'application/json',
    'content-type': 'application/json',
  };

  const token = process.env.BRAIN_GRAPH_SEARCH_TOKEN;
  if (token) headers.authorization = `Bearer ${token}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, limit }),
    cache: 'no-store',
    signal: AbortSignal.timeout(4_000),
  });

  if (!response.ok) {
    throw new Error(`Brain Graph search failed with HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as BrainGraphSearchResponse | BrainGraphSearchItem[];
  const items = Array.isArray(payload) ? payload : payload.results ?? [];

  return items.flatMap((item): SortedResult[] => {
    if (!isSearchItem(item) || !isNavigableUrl(item.url)) return [];

    return [
      {
        id: `graph:${item.id}`,
        url: item.url,
        type: 'page',
        content: item.title,
        breadcrumbs: [
          'Adaptive Brain',
          ...(item.brainId ? [item.brainId] : []),
          ...(item.abstract ? [item.abstract] : []),
        ],
      },
    ];
  });
}

function isSearchItem(value: unknown): value is BrainGraphSearchItem {
  if (!value || typeof value !== 'object') return false;

  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    item.id.length > 0 &&
    typeof item.title === 'string' &&
    item.title.length > 0 &&
    (item.brainId === undefined || typeof item.brainId === 'string') &&
    (item.canonicalRef === undefined || typeof item.canonicalRef === 'string') &&
    (item.url === undefined || typeof item.url === 'string') &&
    (item.abstract === undefined || typeof item.abstract === 'string')
  );
}

function isNavigableUrl(url: string | undefined): url is string {
  if (!url) return false;

  return ['/', 'https://', 'http://'].some((prefix) => url.startsWith(prefix));
}
