import { getSourceHealth } from '@/lib/source-health';
import {
  createStatusExport,
  statusExportFilename,
} from '@/lib/status-export';

export const dynamic = 'force-dynamic';

export async function GET() {
  const health = await getSourceHealth();
  const document = createStatusExport(health);
  const filename = statusExportFilename(document.generatedAt);

  return new Response(`${JSON.stringify(document, null, 2)}\n`, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}
