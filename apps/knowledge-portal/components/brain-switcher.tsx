import { BrainGlyph, KnowledgeMark, SourceGlyph } from '@/components/knowledge-visuals';
import { getBrainNavigation, type KnowledgeSourceClass } from '@/lib/brain-navigation';

const labels: Record<KnowledgeSourceClass, string> = {
  canonical: 'Canonical',
  evidence: 'Evidence',
  derived: 'Derived',
};

export async function BrainSwitcher({ activeId }: { activeId?: string }) {
  const items = await getBrainNavigation();
  const active = items.find((item) => item.id === activeId) ?? items[0];

  if (!active) return null;

  return (
    <section aria-label="Wissensbereich wechseln" className="kp-brain-switcher">
      <div className="kp-section-kicker">Aktiver Wissensbereich</div>
      <details className="kp-brain-select">
        <summary className="kp-brain-select-summary">
          <BrainGlyph id={active.id} label={active.label} className="kp-brain-glyph" />
          <span className="kp-brain-select-copy">
            <span className="kp-brain-select-label">{active.label}</span>
            <span className="kp-brain-select-description">
              {active.description ?? labels[active.sourceClass]}
            </span>
          </span>
          <span className="kp-brain-select-meta">
            <SourceGlyph sourceClass={active.sourceClass} className="kp-source-glyph" />
            <svg aria-hidden="true" viewBox="0 0 20 20" className="kp-chevron">
              <path
                d="m5.5 7.5 4.5 4.5 4.5-4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              />
            </svg>
          </span>
        </summary>

        <div className="kp-brain-menu">
          <div className="kp-brain-menu-header">
            <span>Wissensbereiche</span>
            <span>{items.length}</span>
          </div>
          <div className="kp-brain-menu-list">
            {items.map((item) => {
              const isActive = item.id === active.id;

              return (
                <a
                  key={item.id}
                  href={item.url}
                  aria-current={isActive ? 'page' : undefined}
                  className="kp-brain-option"
                  data-active={isActive ? 'true' : 'false'}
                >
                  <BrainGlyph id={item.id} label={item.label} className="kp-brain-glyph" />
                  <span className="kp-brain-option-main">
                    <span className="kp-brain-option-label">{item.label}</span>
                    {item.description ? (
                      <span className="kp-brain-option-description">{item.description}</span>
                    ) : null}
                  </span>
                  <span className="kp-brain-option-state">
                    <SourceGlyph sourceClass={item.sourceClass} className="kp-source-glyph" />
                    <span>{labels[item.sourceClass]}</span>
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </details>
    </section>
  );
}

export function SourceBoundaryNote() {
  return (
    <div className="kp-source-boundary-note">
      <KnowledgeMark className="kp-boundary-mark" />
      <span>Read-only Portal · Quellenautorität bleibt erhalten</span>
    </div>
  );
}
