import { PersonalKnowledgePanel } from '@/components/knowledge-history';
import { BrainGlyph, KnowledgeMark, SourceGlyph } from '@/components/knowledge-visuals';
import { getBrainNavigation } from '@/lib/brain-navigation';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const items = await getBrainNavigation();
  const canonical = items.filter((item) => item.sourceClass === 'canonical');
  const evidence = items.filter((item) => item.sourceClass === 'evidence');
  const derived = items.filter((item) => item.sourceClass === 'derived');
  const featured = canonical.slice(0, 10);

  return (
    <main className="kp-home">
      <section className="kp-home-hero">
        <div className="kp-home-hero-network" aria-hidden="true">
          <KnowledgeMark className="kp-home-hero-network-mark" />
        </div>

        <div className="kp-home-brand">
          <img
            className="kp-home-brand-logo"
            src="/brand/logo-dark.svg"
            alt="Ratzeburg AI Brain — Knowledge Portal"
          />
        </div>

        <div className="kp-home-copy">
          <h1>Governed knowledge, sichtbar verbunden.</h1>
          <p>
            Kanonische Child Brains, freigegebene Evidence und abgeleitete Suchprojektionen bleiben
            klar unterscheidbar — mit direktem Weg zurück zur jeweiligen Quelle.
          </p>
        </div>

        <div className="kp-home-actions">
          <a className="kp-home-primary-action" href="/search">
            <span className="kp-home-action-glyph" aria-hidden="true">⌕</span>
            <span>Knowledge Search</span>
          </a>
          <a className="kp-home-secondary-action" href="/status">
            <span className="kp-home-action-glyph" aria-hidden="true">●</span>
            <span>Source Health</span>
          </a>
          <a className="kp-home-secondary-action" href="/drive">
            <SourceGlyph sourceClass="evidence" className="kp-home-action-glyph" />
            <span>Drive Evidence</span>
          </a>
        </div>
      </section>

      <section className="kp-home-source-grid" aria-label="Quellenklassen">
        <SourceCard
          sourceClass="canonical"
          title="Canonical"
          count={canonical.length}
          description="Git-backed Child Brains bleiben Eigentümer des kuratierten Wissens."
        />
        <SourceCard
          sourceClass="evidence"
          title="Evidence"
          count={evidence.length}
          description="Drive und andere Quellsysteme bleiben Eigentümer ihrer Originalartefakte."
        />
        <SourceCard
          sourceClass="derived"
          title="Derived"
          count={derived.length}
          description="Suche und Graph-Projektionen unterstützen Retrieval, übernehmen aber keine Autorität."
        />
      </section>

      <PersonalKnowledgePanel />

      {featured.length > 0 ? (
        <section className="kp-home-brains">
          <div className="kp-home-section-heading">
            <div>
              <div className="kp-home-eyebrow">Canonical knowledge</div>
              <h2>Wissensbereiche</h2>
            </div>
            <span>{canonical.length} Child Brains verfügbar</span>
          </div>

          <div className="kp-home-brain-grid">
            {featured.map((item) => (
              <a key={item.id} href={item.url} className="kp-home-brain-card">
                <BrainGlyph id={item.id} label={item.label} className="kp-home-brain-glyph" />
                <span className="kp-home-brain-copy">
                  <strong>{item.label}</strong>
                  <span>{item.description ?? 'Kanonischer Wissensbereich'}</span>
                </span>
                <span className="kp-home-card-arrow" aria-hidden="true">→</span>
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function SourceCard({
  sourceClass,
  title,
  count,
  description,
}: {
  sourceClass: 'canonical' | 'evidence' | 'derived';
  title: string;
  count: number;
  description: string;
}) {
  return (
    <article className="kp-home-source-card" data-source-class={sourceClass}>
      <div className="kp-home-source-card-head">
        <span className="kp-home-source-icon">
          <SourceGlyph sourceClass={sourceClass} />
        </span>
        <span className="kp-home-source-count">{count}</span>
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
    </article>
  );
}
