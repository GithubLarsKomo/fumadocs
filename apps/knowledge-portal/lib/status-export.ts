import type { SourceHealthReport } from '@/lib/source-health';

export const STATUS_EXPORT_SCHEMA = 'ratzeburg-ai-brain/source-health';
export const STATUS_EXPORT_SCHEMA_VERSION = '1.0.0';
export const KNOWLEDGE_PORTAL_RELEASE = 'v6';

export interface StatusExportDocument {
  schema: typeof STATUS_EXPORT_SCHEMA;
  schemaVersion: typeof STATUS_EXPORT_SCHEMA_VERSION;
  generatedAt: string;
  portal: {
    service: 'knowledge-portal';
    product: 'Ratzeburg AI Brain';
    release: typeof KNOWLEDGE_PORTAL_RELEASE;
    buildRevision: string | null;
  };
  health: SourceHealthReport;
}

export function createStatusExport(
  health: SourceHealthReport,
  options: {
    generatedAt?: string;
    env?: NodeJS.ProcessEnv;
  } = {},
): StatusExportDocument {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const env = options.env ?? process.env;

  return {
    schema: STATUS_EXPORT_SCHEMA,
    schemaVersion: STATUS_EXPORT_SCHEMA_VERSION,
    generatedAt,
    portal: {
      service: 'knowledge-portal',
      product: 'Ratzeburg AI Brain',
      release: KNOWLEDGE_PORTAL_RELEASE,
      buildRevision: resolveBuildRevision(env),
    },
    health: {
      status: health.status,
      checkedAt: health.checkedAt,
      summary: { ...health.summary },
      sources: health.sources.map((source) => ({
        id: source.id,
        label: source.label,
        kind: source.kind,
        status: source.status,
        ...(typeof source.itemCount === 'number' ? { itemCount: source.itemCount } : {}),
        ...(source.detail ? { detail: source.detail } : {}),
      })),
    },
  };
}

export function statusExportFilename(generatedAt: string): string {
  const timestamp = generatedAt
    .replace(/\.\d{3}Z$/, 'Z')
    .replace(/:/g, '-');

  return `ratzeburg-ai-brain-status-v${STATUS_EXPORT_SCHEMA_VERSION}-${timestamp}.json`;
}

function resolveBuildRevision(env: NodeJS.ProcessEnv): string | null {
  const candidates = [
    env.SOURCE_COMMIT,
    env.GIT_COMMIT_SHA,
    env.VERCEL_GIT_COMMIT_SHA,
    env.COMMIT_SHA,
  ];

  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (value && /^[0-9a-f]{7,64}$/i.test(value)) return value;
  }

  return null;
}
