import { getRelatedKnowledge } from '@/lib/related-knowledge';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const title = url.searchParams.get('title')?.trim() ?? '';
  const currentUrl = url.searchParams.get('currentUrl')?.trim() ?? '';
  const brainId = url.searchParams.get('brainId')?.trim() || undefined;

  if (!title || !currentUrl || !currentUrl.startsWith('/')) {
    return Response.json([], { status: 400 });
  }

  const items = await getRelatedKnowledge({
    title: title.slice(0, 240),
    currentUrl,
    brainId,
    limit: 8,
  });

  return Response.json(items, {
    headers: {
      'cache-control': 'private, max-age=60',
    },
  });
}
