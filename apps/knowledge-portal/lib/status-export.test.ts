import { describe, expect, it } from 'vitest';
import type { SourceHealthReport } from './source-health';
import {
  createStatusExport,
  statusExportFilename,
  STATUS_EXPORT_SCHEMA_VERSION,
} from './status-export';

const health: SourceHealthReport = {
  status: 'degraded',
  checkedAt: '2026-09-30T06:45:00.000Z',
  summary: {
    healthy: 2,
    degraded: 1,
    total: 3,
  },
  sources: [
    {
      id: 'coding',
      label: 'Coding Brain',
      kind: 'canonical',
      status: 'healthy',
      itemCount: 42,
      detail: 'Canonical Project Memory erreichbar',
    },
    {
      id: 'drive:chatgpt',
      label: 'ChatGPT',
      kind: 'evidence',
      status: 'unavailable',
      detail: 'Drive root is not visible to the portal service account.',
    },
  ],
};

describe('status export', () => {
  it('emits a stable versioned diagnostic document', () => {
    const document = createStatusExport(health, {
      generatedAt: '2026-09-30T06:48:12.345Z',
      env: {
        SOURCE_COMMIT: 'f4f9621072af0706648b387f6fe6892a4a56cd3d',
      },
    });

    expect(document.schemaVersion).toBe(STATUS_EXPORT_SCHEMA_VERSION);
    expect(document.generatedAt).toBe('2026-09-30T06:48:12.345Z');
    expect(document.portal.release).toBe('v6');
    expect(document.portal.buildRevision).toBe('f4f9621072af0706648b387f6fe6892a4a56cd3d');
    expect(document.health.sources[1]?.id).toBe('drive:chatgpt');
  });

  it('does not copy arbitrary environment variables into the export', () => {
    const document = createStatusExport(health, {
      generatedAt: '2026-09-30T06:48:12.345Z',
      env: {
        GOOGLE_SERVICE_ACCOUNT_JSON_B64: 'secret',
        KNOWLEDGE_PORTAL_GITHUB_TOKEN: 'secret',
      },
    });

    expect(document.portal.buildRevision).toBeNull();
    expect(JSON.stringify(document)).not.toContain('secret');
  });

  it('uses schema version and timestamp in the downloaded filename', () => {
    expect(statusExportFilename('2026-09-30T06:48:12.345Z')).toBe(
      `ratzeburg-ai-brain-status-v${STATUS_EXPORT_SCHEMA_VERSION}-2026-09-30T06-48-12Z.json`,
    );
  });
});
