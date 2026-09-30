import { getDriveRoots } from '@/lib/drive-config';
import { getDriveSource } from '@/lib/drive-source';
import { getEnabledFederationBrains } from '@/lib/federation';
import { getGitHubBrainSource } from '@/lib/github-brains';

export type SourceHealthStatus = 'healthy' | 'empty' | 'configured' | 'disabled' | 'unavailable';

export interface SourceHealthItem {
  id: string;
  label: string;
  kind: 'canonical' | 'evidence' | 'derived' | 'federation';
  status: SourceHealthStatus;
  itemCount?: number;
  detail?: string;
}

export interface SourceHealthReport {
  status: 'ok' | 'degraded';
  checkedAt: string;
  summary: { healthy: number; degraded: number; total: number };
  sources: SourceHealthItem[];
}

export async function getSourceHealth(): Promise<SourceHealthReport> {
  const sources: SourceHealthItem[] = [];
  let brains: Awaited<ReturnType<typeof getEnabledFederationBrains>> = [];

  try {
    brains = await getEnabledFederationBrains();
    sources.push({
      id: 'federation',
      label: 'Super Second Brain Federation',
      kind: 'federation',
      status: 'healthy',
      itemCount: brains.length,
      detail: 'Registry erreichbar',
    });
  } catch (error) {
    sources.push({
      id: 'federation',
      label: 'Super Second Brain Federation',
      kind: 'federation',
      status: 'unavailable',
      detail: errorMessage(error),
    });
  }

  try {
    const roots = getDriveRoots();
    const drive = await getDriveSource();
    const pages = drive.getPages();

    for (const root of roots) {
      const count = root.routePrefix
        ? pages.filter((page) => page.slugs[0] === root.routePrefix).length
        : pages.length;
      sources.push({
        id: `drive:${root.routePrefix || root.id}`,
        label: root.label,
        kind: 'evidence',
        status: count > 0 ? 'healthy' : 'empty',
        itemCount: count,
        detail: count > 0 ? 'Drive subtree erreichbar' : 'Keine projizierten Dateien',
      });
    }
  } catch (error) {
    sources.push({
      id: 'drive',
      label: 'Drive Evidence',
      kind: 'evidence',
      status: 'unavailable',
      detail: errorMessage(error),
    });
  }

  const brainItems = await mapWithConcurrency(brains, 4, async (brain): Promise<SourceHealthItem> => {
    try {
      const source = await getGitHubBrainSource(brain.brainId);
      const count = source?.getPages().length ?? 0;
      return {
        id: brain.brainId,
        label: brain.label,
        kind: 'canonical',
        status: count > 0 ? 'healthy' : 'empty',
        itemCount: count,
        detail: count > 0 ? 'Canonical Project Memory erreichbar' : 'Keine projizierten Seiten',
      };
    } catch (error) {
      return {
        id: brain.brainId,
        label: brain.label,
        kind: 'canonical',
        status: 'unavailable',
        detail: errorMessage(error),
      };
    }
  });
  sources.push(...brainItems);

  const graphConfigured = Boolean(process.env.BRAIN_GRAPH_SEARCH_URL);
  sources.push({
    id: 'adaptive-brain',
    label: 'Adaptive Brain',
    kind: 'derived',
    status: graphConfigured ? 'configured' : 'disabled',
    detail: graphConfigured ? 'Derived search facade konfiguriert' : 'Optionaler Kanal nicht konfiguriert',
  });

  const degraded = sources.filter((item) => item.status === 'unavailable').length;
  const healthy = sources.length - degraded;

  return {
    status: degraded > 0 ? 'degraded' : 'ok',
    checkedAt: new Date().toISOString(),
    summary: { healthy, degraded, total: sources.length },
    sources,
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown source error';
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  task: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  async function worker() {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await task(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}
