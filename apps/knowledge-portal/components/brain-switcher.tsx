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
          <span className="kp-brain-select-copy">
            <span className="kp-brain-select-label">{active.label}</span>
            <span className="kp-brain-select-description">
              {active.description ?? labels[active.sourceClass]}
            </span>
          </span>
          <span className="kp-brain-select-meta">
            <SourceDot sourceClass={active.sourceClass} />
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
                  <span className="kp-brain-option-main">
                    <span className="kp-brain-option-label">{item.label}</span>
                    {item.description ? (
                      <span className="kp-brain-option-description">{item.description}</span>
                    ) : null}
                  </span>
                  <span className="kp-brain-option-state">
                    <SourceDot sourceClass={item.sourceClass} />
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

function SourceDot({ sourceClass }: { sourceClass: KnowledgeSourceClass }) {
  return (
    <span
      className="kp-source-dot"
      data-source-class={sourceClass}
      title={labels[sourceClass]}
      aria-label={labels[sourceClass]}
    />
  );
}

export function SourceBoundaryNote() {
  return (
    <div className="kp-source-boundary-note">
      <span className="kp-source-dot" data-source-class="canonical" aria-hidden="true" />
      <span>Read-only Portal · Quellenautorität bleibt erhalten</span>
    </div>
  );
}
