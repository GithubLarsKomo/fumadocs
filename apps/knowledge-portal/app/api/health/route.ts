import { NextResponse } from 'next/server';
import { getSourceHealth } from '@/lib/source-health';

export const dynamic = 'force-dynamic';

export async function GET() {
  const report = await getSourceHealth();
  return NextResponse.json({
    service: 'knowledge-portal',
    ...report,
  });
}
