import type { KnowledgeSourceClass } from '@/lib/brain-navigation';
import { searchKnowledge } from '@/lib/search/knowledge-search';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('query')?.trim() ?? '';
  const limit = normalizeLimit(url.searchParams.get('limit'));
  const sourceClass = normalizeSourceClass(url.searchParams.get('sourceClass'));
  const sourceId = url.searchParams.get('sourceId')?.trim() || undefined;

  if (!query) return Response.json([]);

  const results = await searchKnowledge(query, {
    limit,
    sourceClass,
    sourceId,
  });

  return Response.json(results);
}

function normalizeLimit(value: string | null): number {
  const parsed = value ? Number.parseInt(value, 10) : 20;
  if (!Number.isFinite(parsed)) return 20;
  return Math.max(1, Math.min(parsed, 50));
}

function normalizeSourceClass(value: string | null): KnowledgeSourceClass | undefined {
  if (value === 'canonical' || value === 'evidence' || value === 'derived') return value;
  return undefined;
}
