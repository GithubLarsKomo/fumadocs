'use client';

import { useState } from 'react';

export function StatusExportActions({ schemaVersion }: { schemaVersion: string }) {
  const [state, setState] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle');

  async function copyDiagnosticJson() {
    setState('copying');

    try {
      const response = await fetch('/api/health/export', {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Health export failed with HTTP ${response.status}`);
      }

      const text = await response.text();

      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable');
      }

      await navigator.clipboard.writeText(text);
      setState('copied');

      window.setTimeout(() => {
        setState('idle');
      }, 1800);
    } catch {
      setState('error');

      window.setTimeout(() => {
        setState('idle');
      }, 2500);
    }
  }

  return (
    <div className="kp-status-actions">
      <a href="/api/health/export">JSON-Diagnose exportieren</a>
      <button type="button" onClick={copyDiagnosticJson} disabled={state === 'copying'}>
        {state === 'copying'
          ? 'Kopiere …'
          : state === 'copied'
            ? 'Kopiert ✓'
            : state === 'error'
              ? 'Kopieren fehlgeschlagen'
              : 'Kopieren'}
      </button>
      <span aria-live="polite">
        Schema v{schemaVersion} · Download und Zwischenablage enthalten dasselbe Diagnoseformat
      </span>
    </div>
  );
}
