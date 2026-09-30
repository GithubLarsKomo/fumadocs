import type { Metadata } from 'next';
import { getSourceHealth } from '@/lib/source-health';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'System Status',
  description: 'Status der föderierten Knowledge-Portal-Quellen.',
};

export default async function StatusPage() {
  const report = await getSourceHealth();

  return (
    <main className="kp-tool-page">
      <header className="kp-tool-header">
        <div className="kp-home-eyebrow">Knowledge Portal v6</div>
        <h1>Source Health</h1>
        <p>
          Sichtbarkeit der föderierten Quellen. Empty bedeutet erreichbar ohne projizierte Seiten;
          unavailable bedeutet einen tatsächlichen Quellfehler.
        </p>
      </header>

      <section className="kp-health-summary">
        <StatusMetric label="Gesamt" value={report.summary.total} />
        <StatusMetric label="Healthy" value={report.summary.healthy} />
        <StatusMetric label="Degraded" value={report.summary.degraded} />
        <StatusMetric label="Status" value={report.status.toUpperCase()} />
      </section>

      <section className="kp-health-grid">
        {report.sources.map((source) => (
          <article key={source.id} className="kp-health-card" data-status={source.status}>
            <div className="kp-health-card-head">
              <span>{source.kind}</span>
              <strong>{source.status}</strong>
            </div>
            <h2>{source.label}</h2>
            {typeof source.itemCount === 'number' ? <b>{source.itemCount} Elemente</b> : null}
            {source.detail ? <p>{source.detail}</p> : null}
          </article>
        ))}
      </section>

      <p className="kp-health-time">Geprüft: {new Date(report.checkedAt).toLocaleString('de-DE')}</p>
    </main>
  );
}

function StatusMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="kp-health-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
